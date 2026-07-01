/* ============================================================
   UI KIT — helpers de composants réutilisables
   Capture les styles standards de l'app (bottom sheet, cartes,
   boutons) pour garantir la cohérence visuelle et éviter de
   répéter le même cssText dans chaque écran.

   Usage type :
     const s = uiBottomSheet({ id:'monOverlay', accent:'#22d3ee',
                               title:'Mon écran', icon:'⚙️',
                               subtitle:'Description courte' });
     s.body.innerHTML = uiCard('contenu…') + uiCloseButton('monOverlay');
     s.mount();

   Règle : les NOUVEAUX écrans utilisent ces helpers ; les écrans
   existants migrent au fil des touches (jamais de refonte en bloc).
   ============================================================ */
(function () {
  "use strict";

  // ── Jetons de style (source de vérité) ──────────────────────
  var T = {
    bg:        '#0D0D0D',
    cardBg:    'rgba(255,255,255,0.03)',
    cardBorder:'1px solid rgba(255,255,255,0.08)',
    radius:    '13px',
    txt:       '#e2e8f0',
    mut:       '#94a3b8',
    dim:       '#64748b'
  };
  window.UI_TOKENS = T;

  // ── Bottom sheet standard (overlay + poignée + entête) ──────
  // opts: { id, title, icon, subtitle, accent }
  // Retourne { overlay, sheet, body, mount() } — remplir body puis mount().
  function uiBottomSheet(opts) {
    opts = opts || {};
    var id = opts.id || ('sheet_' + Date.now());
    var old = document.getElementById(id); if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.72);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var accent = opts.accent || '#22d3ee';
    var sheet = document.createElement('div');
    sheet.style.cssText = 'background:' + T.bg + ';border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom));width:100%;max-width:480px;max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border-top:2px solid ' + accent + '59;';

    var head = '<div style="width:36px;height:4px;background:rgba(255,255,255,0.2);border-radius:99px;margin:0 auto 14px;"></div>';
    if (opts.title) {
      head += '<div style="text-align:center;margin-bottom:14px;">'
        + (opts.icon ? '<div style="font-size:1.8em;">' + opts.icon + '</div>' : '')
        + '<h2 style="margin:4px 0 2px;color:white;font-size:1.15em;font-weight:900;">' + opts.title + '</h2>'
        + (opts.subtitle ? '<p style="margin:0;color:' + T.mut + ';font-size:0.74em;">' + opts.subtitle + '</p>' : '')
        + '</div>';
    }
    sheet.innerHTML = head;

    var body = document.createElement('div');
    sheet.appendChild(body);
    overlay.appendChild(sheet);

    return {
      overlay: overlay, sheet: sheet, body: body,
      mount: function () { document.body.appendChild(overlay); return overlay; }
    };
  }
  window.uiBottomSheet = uiBottomSheet;

  // ── Carte standard ──────────────────────────────────────────
  function uiCard(innerHTML, extraStyle) {
    return '<div style="background:' + T.cardBg + ';border:' + T.cardBorder + ';border-radius:' + T.radius + ';padding:12px 14px;margin-bottom:8px;' + (extraStyle || '') + '">' + innerHTML + '</div>';
  }
  window.uiCard = uiCard;

  // ── Ligne d'action tappable (icône + titre + desc + chevron) ─
  function uiActionRow(icon, title, desc, onclick) {
    return '<button onclick="' + onclick + '" style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:' + T.cardBg + ';border:' + T.cardBorder + ';border-radius:' + T.radius + ';padding:12px 13px;cursor:pointer;margin-bottom:7px;">'
      + '<span style="font-size:1.4em;flex-shrink:0;line-height:1;">' + icon + '</span>'
      + '<span style="flex:1;min-width:0;">'
      + '<span style="display:block;font-size:0.86em;font-weight:800;color:' + T.txt + ';">' + title + '</span>'
      + (desc ? '<span style="display:block;font-size:0.68em;color:' + T.mut + ';margin-top:1px;line-height:1.3;">' + desc + '</span>' : '')
      + '</span><span style="color:' + T.dim + ';flex-shrink:0;font-size:1.1em;">›</span></button>';
  }
  window.uiActionRow = uiActionRow;

  // ── Entête de section (petites capitales) ───────────────────
  function uiSectionHeader(label) {
    return '<div style="font-size:0.62em;letter-spacing:2px;text-transform:uppercase;color:' + T.mut + ';font-weight:800;margin:16px 0 8px;">' + label + '</div>';
  }
  window.uiSectionHeader = uiSectionHeader;

  // ── Boutons standards ────────────────────────────────────────
  function uiPrimaryButton(label, onclick, accent) {
    var a = accent || '#22c55e';
    return '<button onclick="' + onclick + '" style="width:100%;padding:14px;background:linear-gradient(135deg,' + a + ',' + a + 'cc);color:white;border:none;border-radius:14px;font-size:0.95em;font-weight:900;cursor:pointer;">' + label + '</button>';
  }
  window.uiPrimaryButton = uiPrimaryButton;

  function uiCloseButton(overlayId, label) {
    return '<button onclick="document.getElementById(\'' + overlayId + '\').remove()" style="margin-top:14px;width:100%;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:14px;color:rgba(255,255,255,0.6);font-weight:700;cursor:pointer;">' + (label || 'Fermer') + '</button>';
  }
  window.uiCloseButton = uiCloseButton;

  // ── Barre de segments (pattern Entraîner / Découvrir) ────────
  // items: [{label, onclick, active}] ; accent = couleur du segment actif
  function uiSegmentBar(items, accent) {
    var a = accent || '#22c55e';
    var btns = items.map(function (it) {
      var st = it.active
        ? 'background:linear-gradient(135deg,' + a + ',' + a + 'cc);color:white;'
        : 'background:transparent;color:' + T.mut + ';';
      return '<button onclick="' + it.onclick + '" style="flex:1;border:none;border-radius:10px;padding:10px 6px;font-weight:800;font-size:0.78em;cursor:pointer;' + st + '">' + it.label + '</button>';
    }).join('');
    return '<div style="display:flex;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:5px;margin-bottom:8px;">' + btns + '</div>';
  }
  window.uiSegmentBar = uiSegmentBar;
})();
