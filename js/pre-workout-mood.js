/* ═══════════════════════════════════════════════════════════════════
   CHECK-IN DE FORME AVANT SÉANCE (roulette 1 à 10)
   ───────────────────────────────────────────────────────────────────
   Avant de démarrer un entraînement, l'utilisateur note sa forme du jour
   sur une roulette de 1 à 10 (même style que l'ancien index d'accueil,
   désormais déplacé ici). Selon le score :
     • 1-3 (faible)  → propose une séance douce (mobilité) ;
     • 4-6 (moyen)   → encourage à son rythme ;
     • 7-10 (élevé)  → invite à donner le meilleur.
   Demandé à CHAQUE séance (matin ≠ soir), cooldown 90 min anti-doublon.
   La valeur alimente l'index de forme existant (setFitnessIndex).
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var GATE_KEY = 'awakMoodPreWorkoutTs';
  var COOLDOWN_MS = 90 * 60 * 1000;

  function _lastTs() {
    try { return parseInt(localStorage.getItem(GATE_KEY), 10) || 0; }
    catch (e) { return 0; }
  }
  function _markAsked() {
    try { localStorage.setItem(GATE_KEY, String(Date.now())); } catch (e) {}
  }

  function shouldAsk() { return (Date.now() - _lastTs()) > COOLDOWN_MS; }

  function gate(proceed) {
    if (typeof proceed !== 'function') return;
    if (!shouldAsk()) { proceed(); return; }
    _markAsked();
    _showModal(proceed);
  }

  function _color(v) { return v <= 3 ? '#ef4444' : v <= 6 ? '#f59e0b' : '#22c55e'; }
  function _rgba(v)  { return v <= 3 ? 'rgba(239,68,68,0.5)' : v <= 6 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)'; }

  function _showModal(proceed) {
    var startVal = 7;
    try {
      if (typeof window.getFitnessIndex === 'function') {
        var g = parseInt(window.getFitnessIndex(), 10);
        if (!isNaN(g)) startVal = g;
      }
    } catch (e) {}

    var overlay = document.createElement('div');
    overlay.id = 'awakMoodPreModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;';

    var C = _color(startVal), circ = 2 * Math.PI * 42;
    var off = circ - (startVal / 10) * circ;

    overlay.innerHTML =
      '<div style="background:linear-gradient(160deg,#12161f,#0d0d12);border:1px solid rgba(34,197,94,0.3);border-radius:22px;padding:24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.6);">'
      + '<div style="text-align:center;font-size:1.15em;font-weight:900;color:#fff;margin-bottom:4px;">Quelle est ta forme ?</div>'
      + '<div style="text-align:center;font-size:0.8em;color:#94a3b8;margin-bottom:14px;">Note ton énergie du moment, avant de commencer.</div>'
      + '<div style="font-size:0.74em;color:#7dd3fc;line-height:1.5;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.2);border-radius:10px;padding:9px 11px;margin-bottom:18px;">💡 À quoi ça sert ? Ta réponse adapte la séance à ta forme du jour : les jours difficiles, l\'intensité baisse et le temps de repos s\'allonge un peu. On suit aussi ton énergie au fil du temps.</div>'
      + '<div style="display:flex;align-items:center;gap:18px;margin-bottom:14px;">'
      +   '<div style="position:relative;width:90px;height:90px;flex-shrink:0;">'
      +     '<svg viewBox="0 0 100 100" style="width:100%;height:100%;transform:rotate(-90deg);">'
      +       '<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>'
      +       '<circle id="mpwCircle" cx="50" cy="50" r="42" fill="none" stroke="' + C + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" style="transition:stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1),stroke 0.3s;filter:drop-shadow(0 0 8px ' + _rgba(startVal) + ');"/>'
      +     '</svg>'
      +     '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
      +       '<div id="mpwValue" style="font-size:1.9em;font-weight:900;color:' + C + ';line-height:1;letter-spacing:-1px;">' + startVal + '</div>'
      +       '<div style="font-size:0.6em;color:#94a3b8;font-weight:700;letter-spacing:1px;margin-top:1px;">/ 10</div>'
      +     '</div>'
      +   '</div>'
      +   '<div style="flex:1;min-width:0;">'
      +     '<input type="range" id="mpwSlider" min="1" max="10" value="' + startVal + '" style="width:100%;cursor:pointer;height:6px;">'
      +     '<div style="display:flex;justify-content:space-between;margin-top:7px;font-size:0.68em;color:#64748b;font-weight:700;"><span>1</span><span>5</span><span>10</span></div>'
      +     '<div style="display:flex;gap:5px;margin-top:9px;">'
      +       '<button data-quick="2" class="mpwQuick" style="flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;border-radius:10px;padding:6px 4px;font-size:0.7em;font-weight:800;cursor:pointer;">😴</button>'
      +       '<button data-quick="5" class="mpwQuick" style="flex:1;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);color:#fbbf24;border-radius:10px;padding:6px 4px;font-size:0.7em;font-weight:800;cursor:pointer;">😐</button>'
      +       '<button data-quick="8" class="mpwQuick" style="flex:1;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);color:#4ade80;border-radius:10px;padding:6px 4px;font-size:0.7em;font-weight:800;cursor:pointer;">🔥</button>'
      +     '</div>'
      +   '</div>'
      + '</div>'
      + '<div id="mpwMsg" style="font-size:0.82em;color:#e2e8f0;line-height:1.5;padding:11px 13px;border-radius:10px;margin-bottom:14px;"></div>'
      + '<div id="mpwActions"></div>'
      + '<button id="mpwStart" style="width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:800;font-size:0.9em;">C\'est parti 💪</button>'
      + '<button id="mpwSkip" style="width:100%;margin-top:8px;padding:10px;border:none;border-radius:11px;cursor:pointer;background:rgba(255,255,255,0.05);color:#94a3b8;font-weight:700;font-size:0.8em;">Passer</button>'
      + '</div>';

    document.body.appendChild(overlay);

    var slider = overlay.querySelector('#mpwSlider');
    var circle = overlay.querySelector('#mpwCircle');
    var valEl  = overlay.querySelector('#mpwValue');
    var msg    = overlay.querySelector('#mpwMsg');
    var actions = overlay.querySelector('#mpwActions');

    function finish() { try { overlay.remove(); } catch (e) {} proceed(); }

    function _save(v) {
      try {
        if (typeof window.setFitnessIndex === 'function') window.setFitnessIndex(v);
        else if (typeof window.updateFitnessIndex === 'function') window.updateFitnessIndex(v);
      } catch (e) {}
    }

    function render(v) {
      v = parseInt(v, 10);
      var col = _color(v);
      if (valEl) { valEl.textContent = v; valEl.style.color = col; }
      if (circle) {
        var o = circ - (v / 10) * circ;
        circle.setAttribute('stroke-dashoffset', o.toFixed(2));
        circle.setAttribute('stroke', col);
        circle.style.filter = 'drop-shadow(0 0 10px ' + _rgba(v) + ')';
      }
      if (v <= 3) {
        msg.style.background = 'rgba(239,68,68,0.08)';
        msg.style.border = '1px solid rgba(239,68,68,0.25)';
        msg.innerHTML = '💙 Journée difficile ? Sois indulgent avec toi — une séance douce compte autant.';
        if (typeof window.startWorkout === 'function') {
          actions.innerHTML = '<button id="mpwSoft" style="width:100%;padding:13px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#5eead4,#14b8a6);color:#062e2a;font-weight:800;font-size:0.88em;margin-bottom:8px;">🧘 Faire plutôt une séance douce (mobilité)</button>';
          var sb = overlay.querySelector('#mpwSoft');
          if (sb) sb.onclick = function () { _save(v); try { overlay.remove(); } catch (e) {} try { window.startWorkout('mobility'); } catch (e) { finish(); } };
        } else { actions.innerHTML = ''; }
      } else if (v <= 6) {
        msg.style.background = 'rgba(245,158,11,0.08)';
        msg.style.border = '1px solid rgba(245,158,11,0.25)';
        msg.innerHTML = '👊 Forme correcte. Vas-y à ton rythme — l\'important, c\'est d\'être là.';
        actions.innerHTML = '';
      } else {
        msg.style.background = 'rgba(34,197,94,0.08)';
        msg.style.border = '1px solid rgba(34,197,94,0.25)';
        msg.innerHTML = '🔥 Belle énergie ! Profite de cette forme pour donner le meilleur.';
        actions.innerHTML = '';
      }
    }

    if (slider) slider.addEventListener('input', function () { render(this.value); });
    Array.prototype.forEach.call(overlay.querySelectorAll('.mpwQuick'), function (b) {
      b.onclick = function () {
        var v = parseInt(b.getAttribute('data-quick'), 10);
        if (slider) slider.value = v;
        render(v);
      };
    });

    overlay.querySelector('#mpwStart').onclick = function () { _save(parseInt(slider.value, 10)); finish(); };
    overlay.querySelector('#mpwSkip').onclick = finish;

    render(startVal);
  }

  window.AwakMoodPreWorkout = { shouldAsk: shouldAsk, gate: gate };
})();
