// ═══════════════════════════════════════════════════════════════════
// Awakened — Moteur d'Événements Narratifs « Le Monde qui s'efface »
// ═══════════════════════════════════════════════════════════════════
// Un seul moteur pour TOUS les événements d'histoire :
//   - rencontres de compagnons
//   - dialogues Esen / Nyra (les deux héros)
//   - petits faits amusants
//   - moments d'ambiance du Système
// Chaque événement = { id, type, trigger, content, once }
// Affichage unifié en overlay, avec image optionnelle.
// 100% local. Anti-doublon via localStorage.
// ═══════════════════════════════════════════════════════════════════
(function() {
'use strict';

// ── PERSONNAGES (référence pour couleurs/images) ───────────────────
const STORY_CHARS = {
    systeme: { name: 'Le Système', color: '#4ade80', image: null },
    esen:    { name: 'Esen',  color: '#4ade80', image: null },   // le silencieux (image à fournir)
    nyra:    { name: 'Nyra',  color: '#a855f7', image: null },   // la joueuse (image à fournir)
    nabdano: { name: '???',   color: '#cbd5e1', image: null },   // jamais nommé tôt
    // compagnons (images déjà en place)
    marcus:  { name: 'Marcus Ironfist', color: '#ef4444', image: 'images/companions/marcus.webp' },
    kira:    { name: 'Kira Shadowstep', color: '#a855f7', image: 'images/companions/kira.webp' },
    chen:    { name: 'Maître Chen',     color: '#06b6d4', image: 'images/companions/chen.webp' },
    elise:   { name: 'Élise Vorn',      color: '#22c55e', image: 'images/companions/elise.webp' },
    yuna:    { name: 'Yuna Veilbreaker',color: '#3b82f6', image: 'images/companions/yuna.webp' }
};

// ── REGISTRE DES ÉVÉNEMENTS ────────────────────────────────────────
// type : 'rencontre' | 'fait' | 'ambiance' | 'dialogue'
// trigger : objet décrivant la condition (évalué par storyEventEligible)
//   { kind:'workouts', value:N } | { kind:'level', value:N }
//   { kind:'rank', value:'D' }   | { kind:'rifts', value:N }
//   { kind:'always' } (pour test/aléatoire)
// content : { speaker:'<charId>', title, pages:[...], image:'<override>' }
// once : true = ne s'affiche qu'une fois (défaut true)
const STORY_EVENTS = [
    {
        id: 'evt_test_systeme',
        type: 'ambiance',
        trigger: { kind: 'workouts', value: 1 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'Première Trace',
            pages: [
                "Tu as bougé. Le monde l'a senti.",
                "C'est infime. Une vibration dans le silence blanc. Mais le Système la consigne : tu existes encore."
            ]
        }
    },
    {
        id: 'evt_rencontre',
        type: 'rencontre',
        trigger: { kind: 'level', value: 5 },
        once: true,
        content: {
            speaker: 'systeme',
            title: 'La Rencontre',
            image: 'images/story/rencontre.webp',
            pages: [
                "Un couloir que le monde a presque oublié. Les murs se défont en poussière lumineuse, verte d'un côté, violette de l'autre.",
                "Quelqu'un se tient là. Une autre silhouette qui ne s'efface pas. Comme toi, elle tient debout dans ce qui s'effondre.",
                "« Tiens. Un autre qui refuse de disparaître. » La voix est légère, presque amusée. « Moi c'est Nyra. Et toi, tu as l'air du genre silencieux. »",
                "L'autre — Esen — ne répond pas tout de suite. Il observe. Puis, simplement : « On survit mieux à deux. »",
                "Le Système consigne, à sa façon froide : « Deux Ancres. Vos signaux se renforcent quand vous êtes proches. Curieux. »",
                "Vous ne le savez pas encore, mais à partir d'ici, vous ne marcherez plus seuls."
            ]
        }
    }
];

// ── ÉTAT / ANTI-DOUBLON ────────────────────────────────────────────
function _seenKey(id) { return 'awakStoryEvt_' + id; }
function storyEventSeen(id) { return localStorage.getItem(_seenKey(id)) === '1'; }
function storyEventMarkSeen(id) { try { localStorage.setItem(_seenKey(id), '1'); } catch(e) {} }

// ── ÉVALUATION DES DÉCLENCHEURS ────────────────────────────────────
function storyEventEligible(evt, ctx) {
    if (!evt || !evt.trigger) return false;
    if ((evt.once !== false) && storyEventSeen(evt.id)) return false;
    const t = evt.trigger;
    switch (t.kind) {
        case 'always':   return true;
        case 'workouts': return (ctx.workouts || 0) >= t.value;
        case 'level':    return (ctx.level || 0) >= t.value;
        case 'rifts':    return (ctx.rifts || 0) >= t.value;
        case 'rank': {
            const order = ['E','D','C','B','A','S','SS','SSS'];
            return order.indexOf(ctx.rank || 'E') >= order.indexOf(t.value);
        }
        default: return false;
    }
}

// ── CONTEXTE JOUEUR (lecture seule, défensive) ─────────────────────
function storyBuildContext() {
    const ctx = { workouts: 0, level: 0, rifts: 0, rank: 'E' };
    try {
        const stats = (typeof loadStats === 'function') ? loadStats() : {};
        ctx.workouts = stats.workouts || 0;
    } catch(e) {}
    try { if (typeof _awakGetCurrentLevel === 'function') ctx.level = _awakGetCurrentLevel(); } catch(e) {}
    try { if (typeof awakGetRank === 'function') ctx.rank = awakGetRank().id; } catch(e) {}
    try {
        const rifts = (typeof awakRiftsLoad === 'function') ? awakRiftsLoad() : [];
        ctx.rifts = rifts.filter(r => r.completed).length;
    } catch(e) {}
    return ctx;
}

// ── SÉLECTION : trouve le prochain événement à jouer ───────────────
function storyPickEvent() {
    const ctx = storyBuildContext();
    for (const evt of STORY_EVENTS) {
        if (storyEventEligible(evt, ctx)) return evt;
    }
    return null;
}

// ── AFFICHAGE UNIFIÉ ───────────────────────────────────────────────
function storyShowEvent(evt) {
    if (!evt || !evt.content) return;
    const c = evt.content;
    const char = STORY_CHARS[c.speaker] || STORY_CHARS.systeme;
    const color = char.color;
    const image = c.image || char.image; // override possible par event
    const pages = c.pages || [];
    let pageIdx = 0;

    const overlay = document.createElement('div');
    overlay.id = 'storyEventOverlay';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:99997;
        background:rgba(0,0,0,0.93); backdrop-filter:blur(9px);
        display:flex; align-items:center; justify-content:center;
        padding:22px; opacity:0; animation:awakFadeIn 0.45s forwards;
    `;

    function render() {
        const isLast = pageIdx >= pages.length - 1;
        overlay.innerHTML = `
            <div style="max-width:400px;width:100%;background:linear-gradient(165deg,${color}14,rgba(8,12,20,0.97) 60%);
                        border:1px solid ${color}55;border-radius:18px;padding:0;overflow:hidden;
                        box-shadow:0 0 44px ${color}33;animation:awakCardRise 0.5s cubic-bezier(0.2,0.8,0.2,1);">
                ${image ? `
                    <div style="width:100%;background:#05070c;display:flex;align-items:center;justify-content:center;border-bottom:1px solid ${color}30;">
                        <img src="${image}" alt="${char.name}" style="width:100%;max-height:300px;object-fit:cover;display:block;"
                             onerror="this.parentElement.style.display='none';" />
                    </div>` : ''}
                <div style="padding:22px 22px 18px;">
                    <div style="font-size:0.62em;letter-spacing:2px;color:${color};font-weight:900;text-transform:uppercase;margin-bottom:6px;">
                        ${char.name}${c.title ? ' · ' + c.title : ''}
                    </div>
                    <div style="font-size:0.95em;line-height:1.65;color:#e2e8f0;min-height:60px;">
                        ${pages[pageIdx] || ''}
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;">
                        <div style="font-size:0.6em;color:#64748b;letter-spacing:1px;">
                            ${pages.length > 1 ? (pageIdx + 1) + ' / ' + pages.length : ''}
                        </div>
                        <button id="storyEvtNext" style="background:${color}22;border:1px solid ${color}66;color:${color};
                                font-weight:800;padding:9px 22px;border-radius:10px;cursor:pointer;font-size:0.85em;letter-spacing:0.5px;">
                            ${isLast ? 'Continuer' : 'Suite →'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        const btn = document.getElementById('storyEvtNext');
        if (btn) btn.onclick = () => {
            if (pageIdx < pages.length - 1) { pageIdx++; render(); }
            else close();
        };
    }

    function close() {
        overlay.style.animation = 'awakFadeOut 0.35s forwards';
        setTimeout(() => overlay.remove(), 350);
    }

    // S'assurer que les keyframes existent (réutilise celles des cartes Système)
    if (!document.getElementById('awakCardStyles')) {
        const s = document.createElement('style');
        s.id = 'awakCardStyles';
        s.textContent = '@keyframes awakCardRise{from{opacity:0;transform:translateY(26px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}';
        document.head.appendChild(s);
    }
    if (!document.getElementById('awakSystemStyles')) {
        const s = document.createElement('style');
        s.id = 'awakSystemStyles';
        s.textContent = '@keyframes awakFadeIn{from{opacity:0}to{opacity:1}}@keyframes awakFadeOut{from{opacity:1}to{opacity:0}}@keyframes awakBlink{50%{opacity:0.3}}';
        document.head.appendChild(s);
    }

    document.body.appendChild(overlay);
    render();
}

// ── POINT D'ENTRÉE : à appeler après une séance / un événement ─────
// Affiche au plus UN événement éligible. Marque comme vu.
function storyCheckEvents(opts) {
    try {
        // Ne pas chevaucher un autre overlay narratif
        if (document.getElementById('storyOverlay') ||
            document.getElementById('storyEventOverlay') ||
            document.getElementById('awakSystemCardOverlay')) return false;
        const evt = storyPickEvent();
        if (!evt) return false;
        if (evt.once !== false) storyEventMarkSeen(evt.id);
        const delay = (opts && opts.delay) || 0;
        setTimeout(() => storyShowEvent(evt), delay);
        return true;
    } catch(e) { return false; }
}

// ── EXPORTS ────────────────────────────────────────────────────────
window.STORY_EVENTS       = STORY_EVENTS;
window.STORY_CHARS        = STORY_CHARS;
window.storyCheckEvents   = storyCheckEvents;
window.storyShowEvent     = storyShowEvent;
window.storyPickEvent     = storyPickEvent;
window.storyEventEligible = storyEventEligible;

})();
