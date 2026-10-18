// v1399 — « Comment c'était ? » en fin de séance : Trop facile · Juste bien ·
// Trop dur. Le choix est rangé sur la séance de l'historique et dans
// awakRessenti (par profil) ; il sert ensuite :
//  - au Parcours de l'Éveil (durées ±10–15 % à la séance suivante, eveil.js) ;
//  - à la surcharge progressive (« Trop dur » → pas de charge plus lourde, app.js).
(function () {
  'use strict';

  var CHOIX = [
    { id: 'facile', nom: 'Trop facile', note: 'Noté : la prochaine séance sera un peu plus corsée.' },
    { id: 'bien', nom: 'Juste bien', note: 'Noté : on garde ce niveau.' },
    { id: 'dur', nom: 'Trop dur', note: 'Noté : la prochaine séance sera un peu plus douce, sans charge plus lourde.' }
  ];
  function cle() { return window._cleProfil ? window._cleProfil('awakRessenti') : 'awakRessenti'; }
  function lire() {
    try { return JSON.parse(localStorage.getItem(window._cleProfilLecture ? window._cleProfilLecture('awakRessenti') : 'awakRessenti') || 'null'); } catch (e) { return null; }
  }
  // Ressenti récent (moins de 10 jours), sinon null
  function recent() { var r = lire(); return r && Date.now() - r.t < 10 * 86400000 ? r.val : null; }

  function noter(val) {
    try { localStorage.setItem(cle(), JSON.stringify({ val: val, t: Date.now() })); } catch (e) {}
    // Sur la dernière séance de l'historique
    try {
      var pid = window.getCurrentProfileId && window.getCurrentProfileId();
      var raw = pid && window.getProfileData ? window.getProfileData(pid, 'workoutHistory') : localStorage.getItem('workoutHistory');
      var h = JSON.parse(raw || '[]');
      if (h[0] && Date.now() - new Date(h[0].date).getTime() < 6 * 3600000) {
        h[0].ressenti = val;
        if (pid && window.setProfileData) window.setProfileData(pid, 'workoutHistory', JSON.stringify(h));
        else localStorage.setItem('workoutHistory', JSON.stringify(h));
      }
    } catch (e) {}
  }

  function carte() {
    var v = document.getElementById('completionView');
    if (!v || v.classList.contains('hidden')) return;
    var old = document.getElementById('awakRessentiCarte'); if (old) old.remove();
    var hote = document.getElementById('completionHabits') || document.getElementById('completionVolume');
    if (!hote || !hote.parentNode) return;
    var c = document.createElement('div');
    c.id = 'awakRessentiCarte';
    c.innerHTML = '<div class="awk-rs-titre">Comment c\'était ?</div>'
      + '<div class="awk-rs-choix">' + CHOIX.map(function (x) {
        return '<button type="button" data-rs="' + x.id + '">' + x.nom + '</button>';
      }).join('') + '</div><div class="awk-rs-note" data-note>La prochaine séance s\'ajuste selon ta réponse.</div>';
    hote.parentNode.insertBefore(c, hote);
    c.querySelectorAll('[data-rs]').forEach(function (b) {
      b.onclick = function () {
        noter(b.dataset.rs);
        c.querySelectorAll('[data-rs]').forEach(function (x) { x.classList.toggle('on', x === b); });
        var ch = CHOIX.filter(function (x) { return x.id === b.dataset.rs; })[0];
        c.querySelector('[data-note]').textContent = ch ? ch.note : '';
      };
    });
  }

  function brancher() {
    var v = document.getElementById('completionView');
    if (!v) return;
    var etait = v.classList.contains('hidden');
    new MutationObserver(function () {
      var cache = v.classList.contains('hidden');
      if (etait && !cache) setTimeout(carte, 50);
      etait = cache;
    }).observe(v, { attributes: true, attributeFilter: ['class'] });
  }

  window.AwakRessenti = { recent: recent, noter: noter, carte: carte };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brancher); else brancher();
})();
