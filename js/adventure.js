// ═══════════════════════════════════════════════════════════════════════
// FitPro Elite — Système d'Aventure v2 (Solo Leveling)
// ═══════════════════════════════════════════════════════════════════════
(function() {
'use strict';

// RARITIES locaux (étendus) — indépendants de items.js
const RARITIES = {
    common:    { id:'common',    label:'E', labelFull:'Commun',     color:'#94a3b8', bg:'rgba(148,163,184,0.10)', glow:'rgba(148,163,184,0.18)', dropRate:0.60 },
    rare:      { id:'rare',      label:'C', labelFull:'Rare',       color:'#3b82f6', bg:'rgba(59,130,246,0.10)',  glow:'rgba(59,130,246,0.28)',  dropRate:0.28 },
    epic:      { id:'epic',      label:'A', labelFull:'Épique',     color:'#a855f7', bg:'rgba(168,85,247,0.10)', glow:'rgba(168,85,247,0.38)', dropRate:0.10 },
    legendary: { id:'legendary', label:'S', labelFull:'Légendaire', color:'#f59e0b', bg:'rgba(245,158,11,0.10)', glow:'rgba(245,158,11,0.45)', dropRate:0.02 },
};
const SLOTS = {
    head:      { label:'Tête',       icon:'⛑️' },
    chest:     { label:'Torse',      icon:'🛡️' },
    hands:     { label:'Mains',      icon:'🥊' },
    legs:      { label:'Jambes',     icon:'🦵' },
    feet:      { label:'Pieds',      icon:'👟' },
    weapon:    { label:'Arme',       icon:'⚔️' },
    accessory: { label:'Accessoire', icon:'💍' },
};

const ADVENTURE_STORAGE = {
    enabled:    'fitpro_adventure_enabled',
    inventory:  'fitpro_inventory',
    equipped:   'fitpro_equipped',
    dailyDrops: 'fitpro_daily_drops',
};
const MAX_DROPS_PER_DAY = 2;

// RARITIES et SLOTS sont définis dans data/items.js (chargé avant adventure.js)

// ── PERSISTENCE ─────────────────────────────────────────────────────────
function getAdventureEnabled() { return localStorage.getItem(ADVENTURE_STORAGE.enabled) === 'true'; }
function setAdventureEnabled(val) { localStorage.setItem(ADVENTURE_STORAGE.enabled, val ? 'true' : 'false'); }
function getInventory() { try { return JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.inventory) || '[]'); } catch(e) { return []; } }
function saveInventory(inv) { localStorage.setItem(ADVENTURE_STORAGE.inventory, JSON.stringify(inv)); }
function getEquipped() {
    try { return { head:null,chest:null,hands:null,legs:null,feet:null,weapon:null,accessory:null, ...JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.equipped)||'{}') }; }
    catch(e) { return { head:null,chest:null,hands:null,legs:null,feet:null,weapon:null,accessory:null }; }
}
function saveEquipped(eq) { localStorage.setItem(ADVENTURE_STORAGE.equipped, JSON.stringify(eq)); }
function getDailyDrops() {
    try {
        const d = JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.dailyDrops)||'{}');
        const today = new Date().toISOString().slice(0,10);
        if (d.date !== today) return { date:today, count:0 };
        return d;
    } catch(e) { return { date:new Date().toISOString().slice(0,10), count:0 }; }
}
function saveDailyDrops(d) { localStorage.setItem(ADVENTURE_STORAGE.dailyDrops, JSON.stringify(d)); }
function getItemById(id) { return EQUIPMENT_DATABASE.find(i => i.id === id) || null; }
function getRarityInfo(id) { return RARITIES[id] || RARITIES.common; }
function getSetById(id) { return EQUIPMENT_SETS[id] || null; }

// ── EQUIP ────────────────────────────────────────────────────────────────
function equipItem(invId) {
    const inv = getInventory();
    const entry = inv.find(e => e.id === invId);
    if (!entry) return false;
    const item = getItemById(entry.itemId);
    if (!item) return false;
    const eq = getEquipped();
    eq[item.slot] = invId;
    saveEquipped(eq);
    return true;
}
function unequipSlot(slot) { const eq = getEquipped(); eq[slot] = null; saveEquipped(eq); }
function getEquippedItems() {
    const eq = getEquipped(), inv = getInventory(), result = {};
    for (const [slot, invId] of Object.entries(eq)) {
        if (!invId) { result[slot] = null; continue; }
        const entry = inv.find(e => e.id === invId);
        result[slot] = entry ? getItemById(entry.itemId) : null;
    }
    return result;
}
function getSetBonuses() {
    const eqItems = getEquippedItems(), setCount = {}, bonuses = [];
    for (const item of Object.values(eqItems)) {
        if (!item?.set) continue;
        setCount[item.set] = (setCount[item.set]||0) + 1;
    }
    for (const [setId, count] of Object.entries(setCount)) {
        const set = getSetById(setId);
        if (!set) continue;
        for (const [threshold, bonus] of Object.entries(set.bonuses)) {
            if (count >= parseInt(threshold)) bonuses.push({ set, bonus, count, threshold:parseInt(threshold) });
        }
    }
    return bonuses;
}
function getPlayerEquipStats() {
    const eqItems = getEquippedItems(), setBonuses = getSetBonuses();
    const stats = { strength:0, agility:0, endurance:0, vitality:0 };
    for (const item of Object.values(eqItems)) {
        if (!item) continue;
        for (const [s,v] of Object.entries(item.stats||{})) stats[s] = (stats[s]||0)+v;
    }
    for (const {bonus} of setBonuses) {
        for (const [s,v] of Object.entries(bonus.stats||{})) stats[s] = (stats[s]||0)+v;
    }
    return stats;
}

// ── DROP SYSTEM ──────────────────────────────────────────────────────────
function tryEquipmentDrop(muscle) {
    if (!getAdventureEnabled()) return null;
    const daily = getDailyDrops();
    if (daily.count >= MAX_DROPS_PER_DAY) return null;
    if (Math.random() > 0.65) return null;
    const roll = Math.random();
    let cumul = 0, rarity = 'common';
    for (const [id,r] of Object.entries(RARITIES)) { cumul += r.dropRate; if (roll <= cumul) { rarity = id; break; } }
    const candidates = EQUIPMENT_DATABASE.filter(i => i.rarity === rarity && (i.muscle === muscle || i.muscle === 'Corps entier'));
    const pool = candidates.length > 0 ? candidates : EQUIPMENT_DATABASE.filter(i => i.rarity === rarity);
    if (!pool.length) return null;
    const item = pool[Math.floor(Math.random()*pool.length)];
    const inv = getInventory();
    inv.unshift({ itemId:item.id, obtainedAt:new Date().toISOString(), id:Date.now() });
    saveInventory(inv);
    daily.count++;
    saveDailyDrops(daily);
    return { item, rarity:RARITIES[rarity] };
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════
function renderAdventureDisabled() {
    return `<div style="background:linear-gradient(160deg,#0a0014,#00081a);border:1px solid rgba(168,85,247,0.2);border-radius:20px;padding:28px 20px;text-align:center;">
        <div style="font-size:0.6em;color:rgba(168,85,247,0.5);font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px;">⚠ SYSTÈME ⚠</div>
        <div style="font-size:3em;margin-bottom:14px;">⚔️</div>
        <h2 style="color:white;font-size:1.15em;font-weight:900;margin-bottom:8px;">Mode Chasseur</h2>
        <p style="color:#475569;font-size:0.82em;line-height:1.6;margin-bottom:22px;">Active le mode aventure pour recevoir des défis du Système, obtenir des équipements et bâtir ton chasseur.</p>
        <div style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);border-radius:14px;padding:14px;margin-bottom:20px;text-align:left;display:flex;flex-direction:column;gap:10px;">
            ${[['📜','Défis imposés','Accomplis-les ou subis les conséquences'],['🎒','Équipements','Gagne des items en t\'entraînant (max 2/jour)'],['🛡️','Sets légendaires','Complète des sets pour des bonus surpuissants']].map(([icon,title,desc])=>`
            <div style="display:flex;gap:10px;align-items:center;">
                <span style="font-size:1.2em;">${icon}</span>
                <div><div style="font-size:0.82em;font-weight:700;color:#e2e8f0;">${title}</div><div style="font-size:0.7em;color:#475569;">${desc}</div></div>
            </div>`).join('')}
        </div>
        <button onclick="setAdventureEnabled(true);renderAdventureTab();" style="width:100%;padding:15px;border-radius:14px;border:none;cursor:pointer;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;font-size:0.95em;font-weight:800;box-shadow:0 4px 24px rgba(124,58,237,0.4);">
            ⚔️ Éveiller le Mode Chasseur
        </button>
    </div>`;
}

function renderHunterCard() {
    const rpgData = (typeof rpgLoad==='function') ? rpgLoad() : { muscles:{}, profile:{xp:0} };
    const totalXP = rpgData?.profile?.xp || Object.values(rpgData?.muscles||{}).reduce((s,m)=>s+(m.xp||0),0);
    const level   = (typeof rpgLevelFromXP==='function') ? rpgLevelFromXP(totalXP) : 1;
    const xpHigh  = (typeof rpgXPForLevel==='function') ? rpgXPForLevel(level+1) : 1000;
    const xpLow   = (typeof rpgXPForLevel==='function') ? rpgXPForLevel(level) : 0;
    const xpPct   = Math.min(100, Math.round(((totalXP-xpLow)/Math.max(1,xpHigh-xpLow))*100));
    const daily   = getDailyDrops();
    const eqStats = getPlayerEquipStats();
    const rank = level<5?{r:'E',c:'#94a3b8'}:level<15?{r:'D',c:'#22c55e'}:level<30?{r:'C',c:'#3b82f6'}:level<50?{r:'B',c:'#a855f7'}:level<70?{r:'A',c:'#f59e0b'}:{r:'S',c:'#ef4444'};
    const stats = [{icon:'⚔️',label:'Force',val:10+eqStats.strength,c:'#ef4444'},{icon:'⚡',label:'Agilité',val:10+eqStats.agility,c:'#f59e0b'},{icon:'💚',label:'Endurance',val:10+eqStats.endurance,c:'#22c55e'},{icon:'💙',label:'Vitalité',val:10+eqStats.vitality,c:'#3b82f6'}];
    const maxS = Math.max(...stats.map(s=>s.val),20);

    // Check if RPG mode is enabled
    const rpgOn = typeof rpgEnabled === 'function' ? rpgEnabled() : localStorage.getItem('fitproGameMode') === '1';
    const rpgWarning = !rpgOn ? `
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div>
                <div style="font-size:0.72em;font-weight:700;color:#fbbf24;">Mode RPG désactivé</div>
                <div style="font-size:0.65em;color:#475569;">Active-le pour accumuler de l'XP</div>
            </div>
            <button onclick="if(typeof setRPGMode==='function')setRPGMode(true);else localStorage.setItem('fitproGameMode','1');renderAdventureTab();"
                    style="padding:6px 12px;border-radius:8px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:0.72em;font-weight:700;cursor:pointer;white-space:nowrap;">
                ⚡ Activer
            </button>
        </div>` : '';

    return `<div style="background:linear-gradient(160deg,#0a001a,#00081a,#0a001a);border:1px solid rgba(168,85,247,0.22);border-radius:20px;padding:18px;margin-bottom:12px;box-shadow:0 0 30px rgba(168,85,247,0.07);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,0.12),transparent 70%);pointer-events:none;"></div>
        ${rpgWarning}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;border-radius:12px;background:${rank.c}20;border:1.5px solid ${rank.c}60;display:flex;align-items:center;justify-content:center;font-size:1.3em;font-weight:900;color:${rank.c};box-shadow:0 0 14px ${rank.c}30;">${rank.r}</div>
                <div>
                    <div style="font-size:0.58em;color:rgba(255,255,255,0.3);font-weight:700;text-transform:uppercase;letter-spacing:2px;">Rang Chasseur</div>
                    <div style="font-size:1em;font-weight:900;color:white;">Niveau ${level}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.58em;color:rgba(255,255,255,0.3);font-weight:700;">Drops</div>
                <div style="font-size:1em;font-weight:900;color:${daily.count<MAX_DROPS_PER_DAY?'#a855f7':'#334155'};">${daily.count}/${MAX_DROPS_PER_DAY}</div>
            </div>
        </div>
        <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:0.6em;color:rgba(255,255,255,0.3);font-weight:600;">XP TOTAL</span>
                <span style="font-size:0.6em;color:rgba(168,85,247,0.7);font-weight:700;">${totalXP.toLocaleString()} / ${xpHigh.toLocaleString()}</span>
            </div>
            <div style="height:5px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:99px;box-shadow:0 0 6px rgba(168,85,247,0.4);transition:width 0.8s;"></div>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
            ${stats.map(s=>`<div style="display:flex;align-items:center;gap:8px;">
                <span style="width:16px;text-align:center;font-size:0.75em;">${s.icon}</span>
                <span style="width:60px;font-size:0.68em;color:rgba(255,255,255,0.35);font-weight:600;">${s.label}</span>
                <div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;"><div style="height:100%;width:${Math.round((s.val/Math.max(maxS,30))*100)}%;background:${s.c};border-radius:99px;"></div></div>
                <span style="font-size:0.75em;font-weight:800;color:${s.c};width:24px;text-align:right;">${s.val}</span>
            </div>`).join('')}
        </div>
        <button onclick="setAdventureEnabled(false);renderAdventureTab();" style="margin-top:12px;width:100%;padding:6px;border-radius:8px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.12);color:#f87171;font-size:0.7em;font-weight:700;cursor:pointer;">✕ Désactiver</button>
    </div>`;
}

function renderEquipmentPanel() {
    const eqItems = getEquippedItems(), eq = getEquipped();
    const setBonuses = getSetBonuses();
    const eqStats = getPlayerEquipStats();
    const gearScore = Object.values(eqItems).reduce((s, item) => {
        if (!item) return s;
        const r = getRarityInfo(item.rarity);
        const base = Object.values(item.stats||{}).reduce((a,b)=>a+b,0);
        return s + Math.round(base * (r.id==='legendary'?4:r.id==='epic'?2.5:r.id==='rare'?1.5:1));
    }, 0);

    // Slot helper: renders a single slot cell
    function slotCell(slotId, size='normal') {
        const slotInfo = SLOTS[slotId], item = eqItems[slotId], invId = eq[slotId];
        const dim = size === 'large' ? '64px' : '52px';
        if (item) {
            const r = getRarityInfo(item.rarity);
            return `<div onclick="showItemDetail('${item.id}','equipped',${invId})" style="
                width:${dim};height:${dim};border-radius:8px;cursor:pointer;
                background:${r.bg};border:1.5px solid ${r.color}60;
                display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
                box-shadow:0 0 10px ${r.glow},inset 0 0 8px ${r.bg};
                position:relative;transition:transform 0.12s;
            ">
                <span style="font-size:${size==='large'?'1.5em':'1.2em'};line-height:1;">${item.icon}</span>
                <span style="font-size:0.42em;color:${r.color};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:0 2px;text-align:center;line-height:1.2;overflow:hidden;max-width:${dim};">${item.name.split(' ').slice(0,2).join(' ')}</span>
                <div style="position:absolute;top:2px;right:2px;font-size:0.45em;font-weight:900;color:${r.color};">${r.label}</div>
                <div style="position:absolute;inset:0;border-radius:8px;border:1px solid ${r.color}30;pointer-events:none;"></div>
            </div>`;
        }
        return `<div style="
            width:${dim};height:${dim};border-radius:8px;
            background:rgba(6,182,212,0.03);
            border:1.5px solid rgba(6,182,212,0.18);
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
            position:relative;
        ">
            <span style="font-size:${size==='large'?'1.3em':'1em'};opacity:0.2;">${slotInfo.icon}</span>
            <span style="font-size:0.42em;color:rgba(6,182,212,0.25);font-weight:600;letter-spacing:0.5px;">${slotInfo.label.toUpperCase()}</span>
            <!-- Corner accents -->
            <div style="position:absolute;top:0;left:0;width:8px;height:8px;border-top:1.5px solid rgba(6,182,212,0.3);border-left:1.5px solid rgba(6,182,212,0.3);border-radius:1px 0 0 0;"></div>
            <div style="position:absolute;top:0;right:0;width:8px;height:8px;border-top:1.5px solid rgba(6,182,212,0.3);border-right:1.5px solid rgba(6,182,212,0.3);border-radius:0 1px 0 0;"></div>
            <div style="position:absolute;bottom:0;left:0;width:8px;height:8px;border-bottom:1.5px solid rgba(6,182,212,0.3);border-left:1.5px solid rgba(6,182,212,0.3);border-radius:0 0 0 1px;"></div>
            <div style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-bottom:1.5px solid rgba(6,182,212,0.3);border-right:1.5px solid rgba(6,182,212,0.3);border-radius:0 0 1px 0;"></div>
        </div>`;
    }

    // Character silhouette SVG
    const silhouette = `<svg viewBox="0 0 80 180" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70px;height:160px;filter:drop-shadow(0 0 12px rgba(6,182,212,0.6));">
        <!-- Head -->
        <ellipse cx="40" cy="20" rx="13" ry="15" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.5)" stroke-width="1"/>
        <!-- Neck -->
        <rect x="35" y="33" width="10" height="8" rx="2" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.4)" stroke-width="0.8"/>
        <!-- Torso -->
        <path d="M18 42 Q16 70 18 95 L62 95 Q64 70 62 42 Q52 38 40 38 Q28 38 18 42Z" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.45)" stroke-width="1"/>
        <!-- Left arm -->
        <path d="M18 44 Q8 52 7 75 Q6 88 10 98 L16 96 Q14 84 14 72 Q15 58 20 50Z" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Right arm -->
        <path d="M62 44 Q72 52 73 75 Q74 88 70 98 L64 96 Q66 84 66 72 Q65 58 60 50Z" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Left hand -->
        <ellipse cx="11" cy="102" rx="6" ry="7" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Right hand -->
        <ellipse cx="69" cy="102" rx="6" ry="7" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Left leg -->
        <path d="M22 95 Q19 125 18 150 L30 152 Q32 127 34 95Z" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Right leg -->
        <path d="M58 95 Q61 125 62 150 L50 152 Q48 127 46 95Z" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Left foot -->
        <ellipse cx="24" cy="156" rx="9" ry="5" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Right foot -->
        <ellipse cx="56" cy="156" rx="9" ry="5" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.35)" stroke-width="0.8"/>
        <!-- Center line glow -->
        <line x1="40" y1="38" x2="40" y2="95" stroke="rgba(6,182,212,0.2)" stroke-width="0.5" stroke-dasharray="3,3"/>
    </svg>`;

    // Set bonuses
    const seen = {};
    const bonusRows = setBonuses.map(({set,bonus,count}) => {
        const k=set.id+bonus.desc; if(seen[k]) return ''; seen[k]=true;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(6,182,212,0.08);">
            <span style="font-size:0.65em;color:rgba(245,158,11,0.9);font-weight:700;">${set.icon} ${set.name} ${count}/4</span>
            <span style="font-size:0.62em;color:#4ade80;">${bonus.desc}</span>
        </div>`;
    }).join('');

    return `
    <!-- SYSTEM EQUIPMENT -->
    <div style="
        background:linear-gradient(160deg,#020b18,#030e1f,#020b18);
        border:1px solid rgba(6,182,212,0.3);
        border-radius:16px;
        padding:0;overflow:hidden;
        margin-bottom:12px;
        box-shadow:0 0 30px rgba(6,182,212,0.08),inset 0 0 40px rgba(6,182,212,0.02);
        position:relative;
    ">
        <!-- HUD corner decorations -->
        <div style="position:absolute;top:0;left:0;width:16px;height:16px;border-top:2px solid rgba(6,182,212,0.7);border-left:2px solid rgba(6,182,212,0.7);border-radius:2px 0 0 0;z-index:2;"></div>
        <div style="position:absolute;top:0;right:0;width:16px;height:16px;border-top:2px solid rgba(6,182,212,0.7);border-right:2px solid rgba(6,182,212,0.7);border-radius:0 2px 0 0;z-index:2;"></div>
        <div style="position:absolute;bottom:0;left:0;width:16px;height:16px;border-bottom:2px solid rgba(6,182,212,0.7);border-left:2px solid rgba(6,182,212,0.7);border-radius:0 0 0 2px;z-index:2;"></div>
        <div style="position:absolute;bottom:0;right:0;width:16px;height:16px;border-bottom:2px solid rgba(6,182,212,0.7);border-right:2px solid rgba(6,182,212,0.7);border-radius:0 0 2px 0;z-index:2;"></div>

        <!-- Header -->
        <div style="
            background:linear-gradient(90deg,transparent,rgba(6,182,212,0.12),transparent);
            border-bottom:1px solid rgba(6,182,212,0.2);
            padding:10px 16px;text-align:center;position:relative;
        ">
            <!-- Left diamond -->
            <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:0.6em;color:rgba(6,182,212,0.5);">◈</span>
            <span style="font-size:0.65em;font-weight:900;color:rgba(6,182,212,0.9);text-transform:uppercase;letter-spacing:4px;">System Equipment</span>
            <!-- Right diamond -->
            <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:0.6em;color:rgba(6,182,212,0.5);">◈</span>
        </div>

        <!-- Main layout: slots left + silhouette + slots right -->
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:16px 12px 12px;">

            <!-- Left slots: weapon + hands -->
            <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                <div style="font-size:0.48em;color:rgba(6,182,212,0.4);font-weight:700;letter-spacing:1px;text-align:center;margin-bottom:2px;">COMBAT</div>
                ${slotCell('weapon')}
                ${slotCell('hands')}
            </div>

            <!-- Center: silhouette + feet at bottom -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
                ${silhouette}
                ${slotCell('feet')}
            </div>

            <!-- Right slots: head, chest, legs, accessory -->
            <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                <div style="font-size:0.48em;color:rgba(6,182,212,0.4);font-weight:700;letter-spacing:1px;text-align:center;margin-bottom:2px;">ARMOR</div>
                ${slotCell('head')}
                ${slotCell('chest')}
                ${slotCell('legs')}
                ${slotCell('accessory')}
            </div>
        </div>

        <!-- Stats panel at bottom -->
        <div style="
            border-top:1px solid rgba(6,182,212,0.15);
            padding:10px 14px;
            background:rgba(6,182,212,0.03);
        ">
            <!-- Stat bars -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;margin-bottom:10px;">
                ${[['⚔️','ATK',eqStats.strength,'#ef4444'],['⚡','AGI',eqStats.agility,'#f59e0b'],['💚','END',eqStats.endurance,'#22c55e'],['💙','VIT',eqStats.vitality,'#3b82f6']].map(([icon,label,val,c])=>`
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-size:0.7em;">${icon}</span>
                    <span style="font-size:0.58em;color:rgba(6,182,212,0.5);font-weight:700;width:22px;">${label}</span>
                    <div style="flex:1;height:3px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;">
                        <div style="height:100%;width:${Math.min(100,Math.round(val/50*100))}%;background:${c};border-radius:99px;box-shadow:0 0 4px ${c};"></div>
                    </div>
                    <span style="font-size:0.62em;color:${c};font-weight:800;width:20px;text-align:right;">+${val}</span>
                </div>`).join('')}
            </div>

            <!-- Gear Score -->
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:0.55em;color:rgba(245,158,11,0.8);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;white-space:nowrap;">GEAR SCORE</span>
                <div style="flex:1;height:5px;background:rgba(255,255,255,0.04);border-radius:99px;overflow:hidden;border:1px solid rgba(245,158,11,0.15);">
                    <div style="height:100%;width:${Math.min(100,Math.round(gearScore/500*100))}%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:99px;box-shadow:0 0 6px rgba(245,158,11,0.5);transition:width 0.8s ease;"></div>
                </div>
                <span style="font-size:0.7em;color:#fbbf24;font-weight:900;white-space:nowrap;">${gearScore}</span>
            </div>

            ${bonusRows ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(6,182,212,0.1);">
                <div style="font-size:0.55em;color:rgba(245,158,11,0.6);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">✨ SET BONUSES</div>
                ${bonusRows}
            </div>` : ''}
        </div>
    </div>`;
}
function renderInventoryPanel() {
    const inv = getInventory(), eq = getEquipped();
    const eqIds = new Set(Object.values(eq).filter(Boolean));
    const daily = getDailyDrops();
    if (!inv.length) return `<div style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:20px;padding:24px;text-align:center;">
        <div style="font-size:0.6em;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">🎒 Inventaire</div>
        <div style="font-size:2.5em;margin-bottom:8px;opacity:0.2;">📦</div>
        <div style="font-size:0.8em;font-weight:700;color:#1e293b;margin-bottom:4px;">Inventaire vide</div>
        <div style="font-size:0.7em;color:#0f172a;">Complète une séance pour obtenir ton premier équipement</div>
        <div style="margin-top:8px;font-size:0.68em;color:${daily.count<MAX_DROPS_PER_DAY?'#7c3aed':'#1e293b'};">${daily.count<MAX_DROPS_PER_DAY?`${MAX_DROPS_PER_DAY-daily.count} drop(s) dispo aujourd'hui`:'Max drops atteint'}</div>
    </div>`;
    const order = ['legendary','epic','rare','common'];
    const grouped = {};
    order.forEach(r=>{ grouped[r]=[]; });
    inv.forEach(entry=>{ const item=getItemById(entry.itemId); if(item) grouped[item.rarity]?.push({entry,item}); });
    return `<div style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:20px;padding:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="font-size:0.6em;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">🎒 Inventaire (${inv.length})</div>
            <div style="font-size:0.65em;color:${daily.count<MAX_DROPS_PER_DAY?'#7c3aed':'#334155'};font-weight:700;">${daily.count}/${MAX_DROPS_PER_DAY} drops</div>
        </div>
        ${order.map(rid=>{
            const items=grouped[rid]; if(!items.length) return '';
            const r=getRarityInfo(rid);
            return `<div style="margin-bottom:10px;">
                <div style="font-size:0.58em;color:${r.color};font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;padding:2px 7px;background:${r.bg};border-radius:5px;display:inline-block;">Rang ${r.label} · ${r.labelFull} (${items.length})</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                    ${items.map(({entry,item})=>{
                        const isEq=eqIds.has(entry.id);
                        return `<div onclick="showItemDetail('${item.id}','inventory',${entry.id})" style="background:${r.bg};border:1px solid ${isEq?r.color:r.color+'25'};border-radius:10px;padding:8px 6px;cursor:pointer;text-align:center;box-shadow:${isEq?`0 0 8px ${r.glow}`:'none'};position:relative;">
                            ${isEq?`<div style="position:absolute;top:2px;right:3px;font-size:0.5em;color:${r.color};font-weight:900;letter-spacing:0.5px;">ON</div>`:''}
                            <div style="font-size:1.5em;margin-bottom:3px;">${item.icon}</div>
                            <div style="font-size:0.57em;font-weight:700;color:${r.color};line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${item.name}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

function renderAdventureTab() {
    const container = document.getElementById('adventureContainer');
    if (!container) return;
    if (!getAdventureEnabled()) { container.innerHTML = renderAdventureDisabled(); return; }
    container.innerHTML = renderHunterCard()
        + (typeof renderChallengeSection==='function' ? renderChallengeSection() : '')
        + renderEquipmentPanel()
        + renderInventoryPanel();
    if (typeof startChallengeTimer==='function') startChallengeTimer();
}

function showItemDetail(itemId, context, invId) {
    const item = getItemById(itemId);
    if (!item) return;
    const r = getRarityInfo(item.rarity), set = item.set ? getSetById(item.set) : null;
    const eq = getEquipped(), isEq = Object.values(eq).includes(invId);
    document.getElementById('itemDetailModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'itemDetailModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.88);display:flex;align-items:flex-end;justify-content:center;padding:0;';
    modal.innerHTML = `<div style="width:100%;max-width:460px;background:#0d0d0d;border-radius:24px 24px 0 0;padding:20px 18px 36px;border:1px solid ${r.color}28;border-bottom:none;box-shadow:0 -8px 40px ${r.glow};animation:slideUpModal 0.28s cubic-bezier(0.34,1.2,0.64,1);max-height:88vh;overflow-y:auto;">
        <div style="width:36px;height:3px;background:#1a1a1a;border-radius:99px;margin:0 auto 18px;"></div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="width:52px;height:52px;border-radius:14px;flex-shrink:0;background:${r.bg};border:1.5px solid ${r.color}38;display:flex;align-items:center;justify-content:center;font-size:1.8em;box-shadow:0 0 14px ${r.glow};">${item.icon}</div>
            <div style="flex:1;">
                <div style="font-size:0.98em;font-weight:900;color:white;margin-bottom:4px;">${item.name}</div>
                <div style="display:flex;gap:5px;flex-wrap:wrap;">
                    <span style="font-size:0.6em;font-weight:800;padding:2px 7px;border-radius:99px;background:${r.bg};color:${r.color};border:1px solid ${r.color}38;">RANG ${r.label} · ${r.labelFull}</span>
                    <span style="font-size:0.6em;font-weight:600;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,0.03);color:#334155;">${SLOTS[item.slot]?.label}</span>
                </div>
            </div>
            <button onclick="document.getElementById('itemDetailModal').remove()" style="width:30px;height:30px;border-radius:50%;background:#111;border:1px solid #1a1a1a;color:#334155;font-size:0.95em;cursor:pointer;flex-shrink:0;">✕</button>
        </div>
        <div style="font-size:0.78em;color:#475569;margin-bottom:14px;line-height:1.6;">${item.description}</div>
        <div style="background:#0a0a0a;border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid #1a1a1a;">
            <div style="font-size:0.56em;color:#1e293b;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Statistiques</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                ${[['⚔️','Force','strength','#ef4444'],['⚡','Agilité','agility','#f59e0b'],['💚','Endurance','endurance','#22c55e'],['💙','Vitalité','vitality','#3b82f6']].map(([icon,label,key,c])=>`
                <div style="display:flex;align-items:center;gap:6px;background:#0d0d0d;padding:7px 9px;border-radius:8px;border:1px solid #1a1a1a;">
                    <span style="font-size:0.82em;">${icon}</span>
                    <span style="font-size:0.68em;color:#1e293b;flex:1;">${label}</span>
                    <span style="font-size:0.85em;font-weight:800;color:${c};">+${item.stats[key]||0}</span>
                </div>`).join('')}
            </div>
        </div>
        ${set?`<div style="background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.12);border-radius:10px;padding:9px 11px;margin-bottom:12px;"><div style="font-size:0.62em;color:#f59e0b;font-weight:700;margin-bottom:2px;">${set.icon} Set : ${set.name}</div><div style="font-size:0.68em;color:#334155;">${set.description}</div></div>`:''}
        <div style="font-size:0.7em;color:#1e293b;font-style:italic;text-align:center;margin-bottom:16px;line-height:1.5;">${item.lore}</div>
        ${context==='inventory'&&invId?`<div style="display:flex;gap:8px;">${isEq?
            `<button onclick="unequipSlot('${item.slot}');renderAdventureTab();document.getElementById('itemDetailModal').remove();" style="flex:1;padding:13px;border-radius:13px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.18);color:#f87171;font-weight:700;cursor:pointer;font-size:0.83em;">✕ Déséquiper</button>` :
            `<button onclick="equipItem(${invId});renderAdventureTab();document.getElementById('itemDetailModal').remove();" style="flex:1;padding:13px;border-radius:13px;background:linear-gradient(135deg,${r.color},${r.color}bb);border:none;color:white;font-weight:800;cursor:pointer;font-size:0.85em;box-shadow:0 4px 14px ${r.glow};">⚔️ Équiper</button>`
        }</div>` : `<button onclick="document.getElementById('itemDetailModal').remove();" style="width:100%;padding:12px;border-radius:12px;background:#0a0a0a;border:1px solid #1a1a1a;color:#334155;font-weight:700;cursor:pointer;font-size:0.82em;">Fermer</button>`}
    </div><style>@keyframes slideUpModal{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}</style>`;
    modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
}

function showDropModal(item, rarityInfo) {
    if (!item) return;
    document.getElementById('dropModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'dropModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `<div style="width:100%;max-width:320px;background:#0a0a0a;border-radius:22px;padding:26px 18px;text-align:center;border:2px solid ${rarityInfo.color};box-shadow:0 0 60px ${rarityInfo.glow},0 0 120px ${rarityInfo.glow}40;animation:dropPop 0.5s cubic-bezier(0.34,1.56,0.64,1);">
        <div style="font-size:0.58em;color:${rarityInfo.color};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">✦ ITEM OBTENU · RANG ${rarityInfo.label} ✦</div>
        <div style="font-size:4em;margin-bottom:8px;filter:drop-shadow(0 0 18px ${rarityInfo.glow});animation:iconBounce 0.6s ease 0.15s both;">${item.icon}</div>
        <div style="font-size:1.1em;font-weight:900;color:white;margin-bottom:4px;">${item.name}</div>
        <div style="font-size:0.68em;padding:2px 10px;border-radius:99px;background:${rarityInfo.bg};color:${rarityInfo.color};border:1px solid ${rarityInfo.color}38;display:inline-block;margin-bottom:10px;font-weight:800;">${rarityInfo.labelFull}</div>
        <div style="font-size:0.75em;color:#334155;margin-bottom:16px;line-height:1.5;">${item.description}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:16px;">
            ${[['⚔️','Force','strength','#ef4444'],['⚡','Agi.','agility','#f59e0b'],['💚','End.','endurance','#22c55e'],['💙','Vita.','vitality','#3b82f6']].map(([icon,label,key,c])=>`<div style="background:#111;border-radius:7px;padding:5px;border:1px solid #1a1a1a;"><span style="font-size:0.72em;">${icon}</span><span style="font-size:0.62em;color:#1e293b;"> ${label} </span><span style="font-size:0.75em;font-weight:800;color:${c};">+${item.stats[key]||0}</span></div>`).join('')}
        </div>
        <button onclick="document.getElementById('dropModal').remove();renderAdventureTab();" style="width:100%;padding:13px;border-radius:13px;border:none;cursor:pointer;background:linear-gradient(135deg,${rarityInfo.color},${rarityInfo.color}bb);color:white;font-size:0.9em;font-weight:800;box-shadow:0 4px 18px ${rarityInfo.glow};">🎒 Ajouter à l'inventaire</button>
    </div><style>@keyframes dropPop{from{transform:scale(0.7);opacity:0}to{transform:scale(1);opacity:1}}@keyframes iconBounce{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}</style>`;
    modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
    if (navigator.vibrate) {
        if (rarityInfo.id==='legendary') navigator.vibrate([100,50,100,50,200]);
        else if (rarityInfo.id==='epic')  navigator.vibrate([80,40,120]);
        else                              navigator.vibrate([60]);
    }
}

function initAdventureSystem() { /* Adventure is separate from RPG */ }

// ═══════════════════════════════════════════════════════════════════════
// MODAL ÉQUIPEMENT RPG — Accessible depuis l'onglet Jeu
// ═══════════════════════════════════════════════════════════════════════
function showRPGEquipmentModal(defaultTab) {
    document.getElementById('rpgEquipModal')?.remove();

    const adventureOn = getAdventureEnabled();
    let selectedInvId = null;   // currently selected inventory item id
    let activeSection = defaultTab === 'inventory' ? 'inventory' : 'equip';

    // ── helpers ──────────────────────────────────────────────────────
    function slotBox(slotId, eqItems, eq, size) {
        const s = size || 44;
        const item = eqItems[slotId];
        const invId = eq[slotId];
        const slotInfo = SLOTS[slotId];
        if (item) {
            const r = getRarityInfo(item.rarity);
            return `<div onclick="window._rpgEqSelectSlot('${slotId}')" style="
                width:${s}px;height:${s}px;border-radius:8px;cursor:pointer;flex-shrink:0;
                background:${r.bg};border:2px solid ${r.color};
                display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
                box-shadow:0 0 10px ${r.glow};position:relative;">
                <span style="font-size:${s>42?'1.35em':'1.1em'};line-height:1;">${item.icon}</span>
                <span style="font-size:0.38em;color:${r.color};font-weight:800;text-transform:uppercase;">${r.label}</span>
            </div>`;
        }
        return `<div style="
            width:${s}px;height:${s}px;border-radius:8px;flex-shrink:0;
            background:rgba(6,182,212,0.04);border:1.5px dashed rgba(6,182,212,0.22);
            display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
            <span style="font-size:${s>42?'1.1em':'0.9em'};opacity:0.25;">${slotInfo.icon}</span>
            <span style="font-size:0.38em;color:rgba(6,182,212,0.2);font-weight:700;letter-spacing:0.5px;">${slotInfo.label.toUpperCase()}</span>
        </div>`;
    }

    function statBar(icon, label, val, color) {
        const pct = Math.min(100, Math.round(val / 80 * 100));
        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <span style="font-size:0.75em;width:16px;text-align:center;">${icon}</span>
            <span style="font-size:0.6em;color:#475569;font-weight:700;width:52px;">${label.toUpperCase()}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;box-shadow:0 0 5px ${color}88;"></div>
            </div>
            <span style="font-size:0.68em;color:${color};font-weight:900;width:24px;text-align:right;">${val}</span>
        </div>`;
    }

    function renderEquipSection() {
        const eq = getEquipped();
        const eqItems = getEquippedItems();
        const st = getPlayerEquipStats();
        const baseSt = { strength: 10, agility: 10, endurance: 10, vitality: 10 };
        const gearScore = Object.values(eqItems).reduce((s, item) => {
            if (!item) return s;
            return s + Object.values(item.stats || {}).reduce((a, b) => a + b, 0);
        }, 0);
        const setBonuses = getSetBonuses();
        const setBonusRows = (() => {
            const seen = {};
            return setBonuses.map(({set, bonus, count}) => {
                const k = set.id + bonus.desc; if (seen[k]) return ''; seen[k] = true;
                return `<div style="font-size:0.62em;color:#fbbf24;margin-top:3px;">${set.icon} <strong>${set.name}</strong> ${count}/4 — ${bonus.desc}</div>`;
            }).join('');
        })();

        const silhouette = `<svg viewBox="0 0 70 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:56px;height:128px;filter:drop-shadow(0 0 14px rgba(6,182,212,0.7));">
            <ellipse cx="35" cy="17" rx="11" ry="13" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.6)" stroke-width="1"/>
            <rect x="30" y="29" width="10" height="7" rx="2" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.4)" stroke-width="0.7"/>
            <path d="M16 37 Q14 62 16 84 L54 84 Q56 62 54 37 Q45 33 35 33 Q25 33 16 37Z" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.5)" stroke-width="0.9"/>
            <path d="M16 39 Q7 46 6 66 Q5 78 9 87 L14 85 Q12 75 12 64 Q13 52 18 45Z" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <path d="M54 39 Q63 46 64 66 Q65 78 61 87 L56 85 Q58 75 58 64 Q57 52 52 45Z" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <ellipse cx="9" cy="91" rx="5" ry="6" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <ellipse cx="61" cy="91" rx="5" ry="6" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <path d="M20 84 Q17 110 16 133 L27 135 Q29 112 30 84Z" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <path d="M50 84 Q53 110 54 133 L43 135 Q41 112 40 84Z" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <ellipse cx="21" cy="138" rx="8" ry="4" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <ellipse cx="49" cy="138" rx="8" ry="4" fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" stroke-width="0.7"/>
            <line x1="35" y1="33" x2="35" y2="84" stroke="rgba(6,182,212,0.15)" stroke-width="0.5" stroke-dasharray="2,3"/>
        </svg>`;

        return `
        <!-- ═══ LAYOUT PRINCIPAL ═══ -->
        <div style="display:flex;gap:10px;">

            <!-- GAUCHE : personnage + slots -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;">
                <div style="font-size:0.52em;color:rgba(6,182,212,0.45);font-weight:700;text-transform:uppercase;letter-spacing:2px;">Personnage</div>

                <!-- Ligne : TÊTE -->
                <div style="display:flex;justify-content:center;">${slotBox('head', eqItems, eq, 44)}</div>

                <!-- Ligne : ARME + silhouette + TORSE -->
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${slotBox('weapon', eqItems, eq, 42)}
                        ${slotBox('hands', eqItems, eq, 42)}
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                        ${silhouette}
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${slotBox('chest', eqItems, eq, 42)}
                        ${slotBox('legs', eqItems, eq, 42)}
                    </div>
                </div>

                <!-- Ligne : PIEDS + ACCESSOIRE -->
                <div style="display:flex;gap:6px;">
                    ${slotBox('feet', eqItems, eq, 42)}
                    ${slotBox('accessory', eqItems, eq, 42)}
                </div>

                <div style="font-size:0.52em;color:rgba(6,182,212,0.35);font-weight:700;text-transform:uppercase;letter-spacing:2px;">Chasseur</div>
            </div>

            <!-- DROITE : stats + détail item sélectionné -->
            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;">

                <!-- Titre section stats -->
                <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:10px;padding:10px 12px;">
                    <div style="font-size:0.52em;color:rgba(6,182,212,0.5);font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">◈ Statistiques</div>
                    ${statBar('⚔️','Attaque', baseSt.strength + st.strength, '#ef4444')}
                    ${statBar('🛡️','Défense', baseSt.vitality + st.vitality, '#3b82f6')}
                    ${statBar('⚡','Agilité', baseSt.agility + st.agility, '#f59e0b')}
                    ${statBar('💚','Endurance', baseSt.endurance + st.endurance, '#22c55e')}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(6,182,212,0.1);">
                        <span style="font-size:0.55em;color:rgba(245,158,11,0.7);font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Gear Score</span>
                        <span style="font-size:0.9em;font-weight:900;color:#fbbf24;">${gearScore}</span>
                    </div>
                    ${setBonusRows ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(245,158,11,0.15);">${setBonusRows}</div>` : ''}
                </div>

                <!-- Détail item sélectionné -->
                <div id="rpgEqItemDetail" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:10px;padding:10px 12px;flex:1;">
                    <div style="font-size:0.52em;color:rgba(168,85,247,0.5);font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">◈ Détails de l'objet</div>
                    <div style="text-align:center;padding:10px 0;">
                        <div style="font-size:1.8em;opacity:0.2;">🔍</div>
                        <div style="font-size:0.65em;color:#1e293b;margin-top:4px;">Sélectionne un slot<br>ou un item</div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function renderInvSection() {
        const inv = getInventory();
        const eq = getEquipped();
        const eqIds = new Set(Object.values(eq).filter(Boolean));
        const daily = getDailyDrops();

        if (!inv.length) return `
            <div style="text-align:center;padding:32px 16px;">
                <div style="font-size:2.5em;margin-bottom:8px;opacity:0.3;">📦</div>
                <div style="font-size:0.8em;font-weight:700;color:#1e293b;">Inventaire vide</div>
                <div style="font-size:0.7em;color:#0f172a;margin-top:4px;">Complète une séance pour obtenir ton premier item</div>
                <div style="margin-top:8px;font-size:0.68em;color:${daily.count < MAX_DROPS_PER_DAY ? '#7c3aed' : '#1e293b'};">
                    ${daily.count < MAX_DROPS_PER_DAY ? `${MAX_DROPS_PER_DAY - daily.count} drop(s) dispo aujourd'hui 🎲` : '⛔ Max drops atteint'}
                </div>
            </div>`;

        const order = ['legendary','epic','rare','common'];
        const grouped = {}; order.forEach(r => { grouped[r] = []; });
        inv.forEach(entry => { const item = getItemById(entry.itemId); if (item) grouped[item.rarity]?.push({entry, item}); });

        return `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="font-size:0.55em;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">🎒 Inventaire (${inv.length} items)</div>
            <div style="font-size:0.62em;color:${daily.count < MAX_DROPS_PER_DAY ? '#7c3aed' : '#334155'};font-weight:700;">${daily.count}/${MAX_DROPS_PER_DAY} drops/jour</div>
        </div>
        ${order.map(rid => {
            const items = grouped[rid]; if (!items.length) return '';
            const r = getRarityInfo(rid);
            return `<div style="margin-bottom:12px;">
                <div style="font-size:0.55em;color:${r.color};font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;padding:2px 8px;background:${r.bg};border-radius:5px;display:inline-block;border:1px solid ${r.color}30;">Rang ${r.label} · ${r.labelFull} (${items.length})</div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                    ${items.map(({entry, item}) => {
                        const isEq = eqIds.has(entry.id);
                        const r2 = getRarityInfo(item.rarity);
                        return `<div onclick="window._rpgInvSelectItem('${item.id}',${entry.id})" style="
                            background:${r2.bg};border:1.5px solid ${isEq ? r2.color : r2.color+'28'};
                            border-radius:10px;padding:8px 5px;cursor:pointer;text-align:center;
                            box-shadow:${isEq ? `0 0 8px ${r2.glow}` : 'none'};position:relative;">
                            ${isEq ? `<div style="position:absolute;top:2px;right:3px;font-size:0.42em;color:${r2.color};font-weight:900;">ON</div>` : ''}
                            <div style="font-size:1.6em;margin-bottom:2px;">${item.icon}</div>
                            <div style="font-size:0.5em;font-weight:700;color:${r2.color};line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${item.name}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('')}`;
    }

    function refreshItemDetail(itemId, context, invId) {
        const detail = document.getElementById('rpgEqItemDetail');
        if (!detail) return;
        if (!itemId) {
            detail.innerHTML = `<div style="font-size:0.52em;color:rgba(168,85,247,0.5);font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">◈ Détails de l'objet</div><div style="text-align:center;padding:10px 0;"><div style="font-size:1.8em;opacity:0.2;">🔍</div><div style="font-size:0.65em;color:#1e293b;margin-top:4px;">Sélectionne un slot<br>ou un item</div></div>`;
            return;
        }
        const item = getItemById(itemId);
        if (!item) return;
        const r = getRarityInfo(item.rarity);
        const eq = getEquipped();
        const isEq = Object.values(eq).includes(invId);
        const set = item.set ? getSetById(item.set) : null;
        detail.innerHTML = `
            <div style="font-size:0.52em;color:rgba(168,85,247,0.5);font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">◈ Détails de l'objet</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:36px;height:36px;border-radius:10px;flex-shrink:0;background:${r.bg};border:1.5px solid ${r.color}55;display:flex;align-items:center;justify-content:center;font-size:1.3em;box-shadow:0 0 10px ${r.glow};">${item.icon}</div>
                <div>
                    <div style="font-size:0.78em;font-weight:900;color:white;line-height:1.2;">${item.name}</div>
                    <span style="font-size:0.55em;font-weight:800;padding:1px 6px;border-radius:99px;background:${r.bg};color:${r.color};border:1px solid ${r.color}38;">RANG ${r.label} · ${r.labelFull}</span>
                </div>
            </div>
            <div style="font-size:0.62em;color:#334155;margin-bottom:8px;line-height:1.5;">${item.description}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;">
                ${[['⚔️','Force','strength','#ef4444'],['⚡','Agilité','agility','#f59e0b'],['💚','Endurance','endurance','#22c55e'],['💙','Vitalité','vitality','#3b82f6']].map(([icon,label,key,c])=>`
                <div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.3);padding:4px 6px;border-radius:7px;border:1px solid #1a2535;">
                    <span style="font-size:0.7em;">${icon}</span>
                    <span style="font-size:0.58em;color:#334155;flex:1;">${label}</span>
                    <span style="font-size:0.72em;font-weight:800;color:${c};">+${item.stats[key]||0}</span>
                </div>`).join('')}
            </div>
            ${set ? `<div style="font-size:0.58em;color:#f59e0b;margin-bottom:8px;">${set.icon} Set : <strong>${set.name}</strong></div>` : ''}
            ${context === 'inventory' && invId != null ? `
            <div style="display:flex;gap:6px;margin-top:4px;">
                ${isEq
                    ? `<button onclick="unequipSlot('${item.slot}');window._rpgRefreshEquipView();document.getElementById('rpgEqItemDetail') && window._rpgRefreshDetail(null,null,null);" style="flex:1;padding:8px;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-weight:700;cursor:pointer;font-size:0.72em;">✕ Déséquiper</button>`
                    : `<button onclick="equipItem(${invId});window._rpgRefreshEquipView();window._rpgRefreshDetail('${itemId}','inventory',${invId});" style="flex:1;padding:8px;border-radius:10px;background:linear-gradient(135deg,${r.color},${r.color}aa);border:none;color:white;font-weight:800;cursor:pointer;font-size:0.72em;box-shadow:0 2px 10px ${r.glow};">⚔️ Équiper</button>`
                }
            </div>` : ''}`;
        selectedInvId = invId;
    }

    // ── Build the full modal ──────────────────────────────────────────
    const modal = document.createElement('div');
    modal.id = 'rpgEquipModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,0.93);display:flex;align-items:flex-end;justify-content:center;';

    function buildModal() {
        const inv = getInventory();
        modal.innerHTML = `
        <div style="
            width:100%;max-width:480px;
            background:linear-gradient(160deg,#030810,#060c18,#030810);
            border-radius:22px 22px 0 0;
            border-top:2px solid rgba(6,182,212,0.5);
            border-left:1.5px solid rgba(6,182,212,0.2);
            border-right:1.5px solid rgba(6,182,212,0.2);
            max-height:92vh;display:flex;flex-direction:column;overflow:hidden;
            box-shadow:0 -8px 50px rgba(6,182,212,0.12);
            position:relative;
        ">
            <!-- Corner HUD accents -->
            <div style="position:absolute;top:0;left:0;width:18px;height:18px;border-top:2px solid rgba(6,182,212,0.8);border-left:2px solid rgba(6,182,212,0.8);border-radius:2px 0 0 0;z-index:2;"></div>
            <div style="position:absolute;top:0;right:0;width:18px;height:18px;border-top:2px solid rgba(6,182,212,0.8);border-right:2px solid rgba(6,182,212,0.8);border-radius:0 2px 0 0;z-index:2;"></div>

            <!-- Handle -->
            <div style="width:36px;height:3px;background:#0d1a2a;border-radius:99px;margin:10px auto 0;flex-shrink:0;"></div>

            <!-- Header -->
            <div style="padding:10px 18px 0;flex-shrink:0;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <div>
                        <div style="font-size:0.58em;color:rgba(6,182,212,0.5);font-weight:900;text-transform:uppercase;letter-spacing:3px;margin-bottom:2px;">◈ System Equipment ◈</div>
                        <div style="font-size:0.82em;font-weight:900;color:white;">Inventaire d'équipement</div>
                    </div>
                    <button onclick="document.getElementById('rpgEquipModal').remove()" style="width:30px;height:30px;border-radius:50%;background:#0a1525;border:1px solid rgba(6,182,212,0.2);color:#475569;font-size:0.95em;cursor:pointer;">✕</button>
                </div>
                <!-- Tabs -->
                <div style="display:flex;gap:6px;margin-bottom:10px;">
                    <button id="rpgTabEquip" onclick="window._rpgSwitchSection('equip')" style="
                        flex:1;padding:8px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.75em;
                        background:${activeSection==='equip'?'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(6,182,212,0.08))':'#0a1525'};
                        color:${activeSection==='equip'?'rgba(6,182,212,0.95)':'#334155'};
                        border:1px solid ${activeSection==='equip'?'rgba(6,182,212,0.4)':'rgba(255,255,255,0.05)'};
                        box-shadow:${activeSection==='equip'?'0 0 12px rgba(6,182,212,0.15)':'none'};
                    ">⚔️ Équipement</button>
                    <button id="rpgTabInv" onclick="window._rpgSwitchSection('inventory')" style="
                        flex:1;padding:8px;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.75em;
                        background:${activeSection==='inventory'?'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(168,85,247,0.08))':'#0a1525'};
                        color:${activeSection==='inventory'?'rgba(168,85,247,0.95)':'#334155'};
                        border:1px solid ${activeSection==='inventory'?'rgba(168,85,247,0.4)':'rgba(255,255,255,0.05)'};
                        box-shadow:${activeSection==='inventory'?'0 0 12px rgba(168,85,247,0.15)':'none'};
                    ">🎒 Inventaire (${inv.length})</button>
                </div>
            </div>

            <!-- Scrollable body -->
            <div id="rpgEquipBody" style="flex:1;overflow-y:auto;padding:0 16px 28px;-webkit-overflow-scrolling:touch;">
                ${!adventureOn
                    ? `<div style="text-align:center;padding:32px 16px;"><div style="font-size:3em;margin-bottom:12px;">⚔️</div><div style="font-size:0.85em;color:#475569;line-height:1.7;">Active le <strong style="color:#a855f7">Mode Chasseur</strong><br>dans l'onglet Jeu pour débloquer<br>le système d'équipement.</div></div>`
                    : activeSection === 'equip' ? renderEquipSection() : renderInvSection()
                }
            </div>
        </div>
        <style>
            #rpgEquipModal button:active { transform: scale(0.97); }
        </style>`;

        // Global handlers
        window._rpgSwitchSection = function(s) {
            activeSection = s;
            buildModal();
        };
        window._rpgInvSelectItem = function(itemId, invId) {
            selectedInvId = invId;
            // Switch to equip tab to show detail, or show detail panel in inventory
            // Show detail inline via a bottom sheet
            refreshItemDetailBottomSheet(itemId, 'inventory', invId);
        };
        window._rpgEqSelectSlot = function(slotId) {
            const eq = getEquipped();
            const eqItems = getEquippedItems();
            const item = eqItems[slotId];
            if (item) refreshItemDetailBottomSheet(item.id, 'equipped', eq[slotId]);
        };
        window._rpgRefreshEquipView = function() {
            buildModal();
        };
        window._rpgRefreshDetail = function(itemId, ctx, invId) {
            refreshItemDetail(itemId, ctx, invId);
        };
    }

    function refreshItemDetailBottomSheet(itemId, context, invId) {
        document.getElementById('rpgItemDetailSheet')?.remove();
        const item = getItemById(itemId);
        if (!item) return;
        const r = getRarityInfo(item.rarity);
        const eq = getEquipped();
        const isEq = Object.values(eq).includes(invId);
        const set = item.set ? getSetById(item.set) : null;

        const sheet = document.createElement('div');
        sheet.id = 'rpgItemDetailSheet';
        sheet.style.cssText = `position:fixed;inset:0;z-index:10200;background:rgba(0,0,0,0.7);display:flex;align-items:flex-end;justify-content:center;`;
        sheet.innerHTML = `
        <div style="
            width:100%;max-width:480px;
            background:linear-gradient(160deg,#060c18,#080d1e);
            border-radius:20px 20px 0 0;
            border-top:2px solid ${r.color}80;
            padding:0 18px 32px;
            box-shadow:0 -6px 40px ${r.glow};
            animation:slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1);
        ">
            <div style="width:36px;height:3px;background:#1a2535;border-radius:99px;margin:10px auto 14px;"></div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <div style="width:52px;height:52px;border-radius:14px;flex-shrink:0;background:${r.bg};border:2px solid ${r.color}55;display:flex;align-items:center;justify-content:center;font-size:1.9em;box-shadow:0 0 18px ${r.glow};">${item.icon}</div>
                <div style="flex:1;">
                    <div style="font-size:1em;font-weight:900;color:white;margin-bottom:4px;">${item.name}</div>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        <span style="font-size:0.6em;font-weight:800;padding:2px 8px;border-radius:99px;background:${r.bg};color:${r.color};border:1px solid ${r.color}40;">RANG ${r.label} · ${r.labelFull}</span>
                        <span style="font-size:0.6em;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.04);color:#475569;border:1px solid #1a2535;">${SLOTS[item.slot]?.label}</span>
                    </div>
                </div>
                <button onclick="document.getElementById('rpgItemDetailSheet').remove()" style="width:30px;height:30px;border-radius:50%;background:#0a1525;border:1px solid #1a2535;color:#475569;cursor:pointer;font-size:0.9em;flex-shrink:0;">✕</button>
            </div>
            <div style="font-size:0.78em;color:#475569;margin-bottom:12px;line-height:1.6;">${item.description}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px;">
                ${[['⚔️','Force','strength','#ef4444'],['⚡','Agilité','agility','#f59e0b'],['💚','Endurance','endurance','#22c55e'],['💙','Vitalité','vitality','#3b82f6']].map(([icon,label,key,c])=>`
                <div style="display:flex;align-items:center;gap:6px;background:rgba(0,0,0,0.4);padding:7px 9px;border-radius:9px;border:1px solid #1a2535;">
                    <span style="font-size:0.85em;">${icon}</span>
                    <span style="font-size:0.68em;color:#1e293b;flex:1;">${label}</span>
                    <span style="font-size:0.88em;font-weight:900;color:${c};">+${item.stats[key]||0}</span>
                </div>`).join('')}
            </div>
            ${set ? `<div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:9px 12px;margin-bottom:12px;">
                <div style="font-size:0.62em;color:#f59e0b;font-weight:700;">${set.icon} Set : <strong>${set.name}</strong></div>
                <div style="font-size:0.65em;color:#334155;margin-top:2px;">${set.description}</div>
            </div>` : ''}
            <div style="font-size:0.7em;color:#1e293b;font-style:italic;text-align:center;margin-bottom:14px;line-height:1.5;">${item.lore}</div>
            <div style="display:flex;gap:8px;">
                ${context === 'inventory' && invId != null
                    ? (isEq
                        ? `<button onclick="unequipSlot('${item.slot}');window._rpgRefreshEquipView();document.getElementById('rpgItemDetailSheet').remove();" style="flex:1;padding:13px;border-radius:13px;background:rgba(239,68,68,0.09);border:1px solid rgba(239,68,68,0.2);color:#f87171;font-weight:700;cursor:pointer;font-size:0.83em;">✕ Déséquiper</button>`
                        : `<button onclick="equipItem(${invId});window._rpgRefreshEquipView();document.getElementById('rpgItemDetailSheet').remove();" style="flex:1;padding:13px;border-radius:13px;background:linear-gradient(135deg,${r.color},${r.color}bb);border:none;color:white;font-weight:800;cursor:pointer;font-size:0.85em;box-shadow:0 4px 16px ${r.glow};">⚔️ Équiper</button>`)
                    : `<button onclick="document.getElementById('rpgItemDetailSheet').remove();" style="flex:1;padding:13px;border-radius:13px;background:#0a1525;border:1px solid #1a2535;color:#475569;font-weight:700;cursor:pointer;font-size:0.82em;">Fermer</button>`
                }
            </div>
        </div>
        <style>@keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}</style>`;
        sheet.addEventListener('click', e => { if (e.target === sheet) sheet.remove(); });
        document.body.appendChild(sheet);
    }

    document.body.appendChild(modal);
    buildModal();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── Exposer les fonctions nécessaires globalement ─────────────────────
window.getAdventureEnabled   = getAdventureEnabled;
window.setAdventureEnabled   = setAdventureEnabled;
window.getInventory          = getInventory;
window.saveInventory         = saveInventory;
window.getEquipped           = getEquipped;
window.saveEquipped          = saveEquipped;
window.getDailyDrops         = getDailyDrops;
window.saveDailyDrops        = saveDailyDrops;
window.getItemById           = getItemById;
window.getRarityInfo         = getRarityInfo;
window.getSetById            = getSetById;
window.equipItem             = equipItem;
window.unequipSlot           = unequipSlot;
window.getEquippedItems      = getEquippedItems;
window.getSetBonuses         = getSetBonuses;
window.getPlayerEquipStats   = getPlayerEquipStats;
window.tryEquipmentDrop      = tryEquipmentDrop;
window.renderAdventureTab    = renderAdventureTab;
window.showItemDetail        = showItemDetail;
window.showDropModal         = showDropModal;
window.initAdventureSystem   = initAdventureSystem;
window.showRPGEquipmentModal = showRPGEquipmentModal;

})(); // end IIFE
