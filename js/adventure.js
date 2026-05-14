// ═══════════════════════════════════════════════════════════════════════
// FitPro Elite — Système d'Aventure (Style Solo Leveling)
// ═══════════════════════════════════════════════════════════════════════

// ── ÉTAT DU SYSTÈME ─────────────────────────────────────────────────────
let adventureEnabled = false;

const ADVENTURE_STORAGE = {
    enabled:    'fitpro_adventure_enabled',
    inventory:  'fitpro_inventory',
    equipped:   'fitpro_equipped',
    dailyDrops: 'fitpro_daily_drops',
    playerStats:'fitpro_player_stats',
};

const MAX_DROPS_PER_DAY = 2;

// ── SLOTS ÉQUIPÉS ────────────────────────────────────────────────────────
const DEFAULT_EQUIPPED = {
    head: null, chest: null, hands: null,
    legs: null, feet: null, weapon: null, accessory: null,
};

// ── STATISTIQUES DE BASE DU JOUEUR ───────────────────────────────────────
const BASE_PLAYER_STATS = {
    strength: 10, agility: 10, endurance: 10, vitality: 10,
};

// ═══════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════
function getAdventureEnabled() {
    return localStorage.getItem(ADVENTURE_STORAGE.enabled) === 'true';
}
function setAdventureEnabled(val) {
    localStorage.setItem(ADVENTURE_STORAGE.enabled, val ? 'true' : 'false');
    adventureEnabled = val;
}

function getInventory() {
    try { return JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.inventory) || '[]'); }
    catch(e) { return []; }
}
function saveInventory(inv) {
    localStorage.setItem(ADVENTURE_STORAGE.inventory, JSON.stringify(inv));
}

function getEquipped() {
    try { return { ...DEFAULT_EQUIPPED, ...JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.equipped) || '{}') }; }
    catch(e) { return { ...DEFAULT_EQUIPPED }; }
}
function saveEquipped(eq) {
    localStorage.setItem(ADVENTURE_STORAGE.equipped, JSON.stringify(eq));
}

function getDailyDrops() {
    try {
        const data = JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.dailyDrops) || '{}');
        const today = new Date().toISOString().slice(0,10);
        if (data.date !== today) return { date: today, count: 0 };
        return data;
    } catch(e) { return { date: new Date().toISOString().slice(0,10), count: 0 }; }
}
function saveDailyDrops(data) {
    localStorage.setItem(ADVENTURE_STORAGE.dailyDrops, JSON.stringify(data));
}

function getPlayerStats() {
    try { return { ...BASE_PLAYER_STATS, ...JSON.parse(localStorage.getItem(ADVENTURE_STORAGE.playerStats) || '{}') }; }
    catch(e) { return { ...BASE_PLAYER_STATS }; }
}

// ═══════════════════════════════════════════════════════════════════════
// SYSTÈME DE DROP
// ═══════════════════════════════════════════════════════════════════════

// Calcule la rareté tirée au sort selon les taux de drop
function rollRarity() {
    const roll = Math.random();
    let cumul = 0;
    for (const [id, r] of Object.entries(RARITIES)) {
        cumul += r.dropRate;
        if (roll <= cumul) return id;
    }
    return 'common';
}

// Tente un drop après une séance
// muscle : groupe musculaire principal entraîné
// Returns : { item, rarity } ou null si pas de drop
function tryEquipmentDrop(muscle) {
    if (!getAdventureEnabled()) return null;

    const daily = getDailyDrops();
    if (daily.count >= MAX_DROPS_PER_DAY) return null;

    // 60% de chance d'avoir un drop après une séance
    if (Math.random() > 0.60) return null;

    const rarity = rollRarity();
    const candidates = EQUIPMENT_DATABASE.filter(item => {
        const muscleMatch = item.muscle === muscle || item.muscle === 'Corps entier';
        const rarityMatch = item.rarity === rarity;
        return muscleMatch && rarityMatch;
    });

    // Fallback : si aucun item de ce muscle à cette rareté, prendre n'importe lequel
    const pool = candidates.length > 0
        ? candidates
        : EQUIPMENT_DATABASE.filter(i => i.rarity === rarity);

    if (pool.length === 0) return null;

    const item = pool[Math.floor(Math.random() * pool.length)];

    // Ajouter à l'inventaire
    const inv = getInventory();
    inv.push({ itemId: item.id, obtainedAt: new Date().toISOString(), id: Date.now() });
    saveInventory(inv);

    // Mettre à jour le compteur journalier
    daily.count++;
    saveDailyDrops(daily);

    return { item, rarity: RARITIES[rarity] };
}

// ═══════════════════════════════════════════════════════════════════════
// ÉQUIPEMENT
// ═══════════════════════════════════════════════════════════════════════

function equipItem(inventoryId) {
    const inv = getInventory();
    const invEntry = inv.find(e => e.id === inventoryId);
    if (!invEntry) return false;

    const item = getItemById(invEntry.itemId);
    if (!item) return false;

    const equipped = getEquipped();

    // Si un item est déjà équipé dans ce slot, le retirer (pas à la poubelle)
    equipped[item.slot] = inventoryId;
    saveEquipped(equipped);
    return true;
}

function unequipSlot(slot) {
    const equipped = getEquipped();
    equipped[slot] = null;
    saveEquipped(equipped);
}

// ═══════════════════════════════════════════════════════════════════════
// STATS CALCULÉES (base + équipements + bonus de sets)
// ═══════════════════════════════════════════════════════════════════════

function getEquippedItems() {
    const equipped = getEquipped();
    const inv = getInventory();
    const result = {};
    for (const [slot, invId] of Object.entries(equipped)) {
        if (!invId) { result[slot] = null; continue; }
        const entry = inv.find(e => e.id === invId);
        if (!entry) { result[slot] = null; continue; }
        result[slot] = getItemById(entry.itemId);
    }
    return result;
}

function getSetBonuses() {
    const equippedItems = getEquippedItems();
    const setCount = {};
    const bonuses = [];

    // Compter les pièces équipées par set
    for (const item of Object.values(equippedItems)) {
        if (!item || !item.set) continue;
        setCount[item.set] = (setCount[item.set] || 0) + 1;
    }

    // Calculer les bonus actifs
    for (const [setId, count] of Object.entries(setCount)) {
        const set = getSetById(setId);
        if (!set) continue;
        for (const [threshold, bonus] of Object.entries(set.bonuses)) {
            if (count >= parseInt(threshold)) {
                bonuses.push({ set, bonus, count, threshold: parseInt(threshold) });
            }
        }
    }

    return bonuses;
}

function getPlayerTotalStats() {
    const base = getPlayerStats();
    const equippedItems = getEquippedItems();
    const setBonus = getSetBonuses();

    const total = { ...base };

    // Ajouter stats des équipements
    for (const item of Object.values(equippedItems)) {
        if (!item) continue;
        for (const [stat, val] of Object.entries(item.stats)) {
            total[stat] = (total[stat] || 0) + val;
        }
    }

    // Ajouter bonus de sets
    for (const { bonus } of setBonus) {
        for (const [stat, val] of Object.entries(bonus.stats || {})) {
            total[stat] = (total[stat] || 0) + val;
        }
    }

    return total;
}

// ═══════════════════════════════════════════════════════════════════════
// RENDU UI
// ═══════════════════════════════════════════════════════════════════════

// NOTE: renderAdventureTab is defined in challenges.js which loads after this file.
// Sub-render functions used by challenges.js:
// renderAdventureDisabled(), renderPlayerCard(), renderEquipmentSlots(),
// renderSetBonusesCard(), renderInventoryCard() are all defined here.

function renderAdventureDisabled() {
    return `
        <div style="text-align:center;padding:40px 20px;">
            <div style="font-size:4em;margin-bottom:16px;">⚔️</div>
            <h2 style="font-size:1.4em;font-weight:900;margin-bottom:8px;">Mode Aventure</h2>
            <p style="color:#64748b;font-size:0.9em;margin-bottom:28px;line-height:1.6;">
                Active le mode aventure pour obtenir des équipements en t'entraînant, constituer des sets puissants, et préparer ton chasseur pour les défis à venir.
            </p>
            <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:20px;padding:20px;margin-bottom:24px;border:1px solid rgba(168,85,247,0.3);">
                <div style="font-size:0.75em;color:rgba(168,85,247,0.8);font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">✨ Ce qui t'attend</div>
                <div style="display:grid;gap:10px;text-align:left;">
                    <div style="display:flex;gap:12px;align-items:flex-start;">
                        <span style="font-size:1.4em;">🗡️</span>
                        <div><div style="font-weight:700;color:white;font-size:0.9em;">Équipements</div><div style="color:#64748b;font-size:0.8em;">Obtiens des items en t'entraînant — max 2/jour</div></div>
                    </div>
                    <div style="display:flex;gap:12px;align-items:flex-start;">
                        <span style="font-size:1.4em;">🛡️</span>
                        <div><div style="font-weight:700;color:white;font-size:0.9em;">Sets d'équipements</div><div style="color:#64748b;font-size:0.8em;">Complète des sets pour des bonus surpuissants</div></div>
                    </div>
                    <div style="display:flex;gap:12px;align-items:flex-start;">
                        <span style="font-size:1.4em;">👾</span>
                        <div><div style="font-weight:700;color:white;font-size:0.9em;">Monstres (bientôt)</div><div style="color:#64748b;font-size:0.8em;">Utilise tes équipements pour vaincre les boss</div></div>
                    </div>
                </div>
            </div>
            <button onclick="toggleAdventureMode()" style="
                width:100%;padding:16px;border-radius:16px;border:none;cursor:pointer;
                background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;
                font-size:1em;font-weight:800;box-shadow:0 4px 20px rgba(124,58,237,0.4);
            ">⚔️ Activer le Mode Aventure</button>
        </div>`;
}

function renderPlayerCard() {
    const stats = getPlayerTotalStats();
    const daily = getDailyDrops();
    const dropsLeft = MAX_DROPS_PER_DAY - daily.count;

    const statBars = [
        { key: 'strength',  label: 'Force',      icon: '⚔️', color: '#ef4444' },
        { key: 'agility',   label: 'Agilité',    icon: '⚡', color: '#f59e0b' },
        { key: 'endurance', label: 'Endurance',  icon: '💚', color: '#22c55e' },
        { key: 'vitality',  label: 'Vitalité',   icon: '💙', color: '#3b82f6' },
    ];
    const maxStat = Math.max(...statBars.map(s => stats[s.key]));

    return `
        <div style="background:linear-gradient(135deg,#0f172a,#1e1b4b);border-radius:20px;padding:18px;margin-bottom:14px;border:1px solid rgba(168,85,247,0.2);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <div>
                    <div style="font-size:0.65em;color:rgba(168,85,247,0.7);font-weight:700;text-transform:uppercase;letter-spacing:2px;">Chasseur</div>
                    <div style="font-size:1.1em;font-weight:900;color:white;">Mes Statistiques</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:0.65em;color:rgba(255,255,255,0.5);font-weight:600;">Drops aujourd'hui</div>
                    <div style="font-size:1.1em;font-weight:900;color:${dropsLeft > 0 ? '#a855f7' : '#ef4444'};">${daily.count}/${MAX_DROPS_PER_DAY}</div>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${statBars.map(s => `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="width:20px;text-align:center;font-size:0.85em;">${s.icon}</span>
                        <div style="width:70px;font-size:0.75em;color:rgba(255,255,255,0.6);font-weight:600;">${s.label}</div>
                        <div style="flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden;">
                            <div style="height:100%;width:${Math.min(100,Math.round((stats[s.key]/Math.max(maxStat,50))*100))}%;background:${s.color};border-radius:99px;transition:width 0.6s ease;"></div>
                        </div>
                        <div style="width:30px;text-align:right;font-size:0.8em;font-weight:700;color:white;">${stats[s.key]}</div>
                    </div>`).join('')}
            </div>
            <button onclick="setAdventureEnabled(false);renderAdventureTab();" style="margin-top:14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#f87171;border-radius:8px;padding:6px 12px;font-size:0.75em;font-weight:700;cursor:pointer;width:100%;">
                ✕ Désactiver le mode aventure
            </button>
        </div>`;
}

function renderEquipmentSlots() {
    const equippedItems = getEquippedItems();
    const slotOrder = ['head','chest','hands','weapon','legs','feet','accessory'];

    return `
        <div style="margin-bottom:14px;">
            <div style="font-size:0.72em;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">🧙 Équipement actuel</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${slotOrder.map(slot => {
                    const item = equippedItems[slot];
                    const slotInfo = SLOTS[slot];
                    if (item) {
                        const rar = getRarityInfo(item.rarity);
                        return `
                            <div onclick="showItemDetail('${item.id}','equipped')" style="
                                background:#141414;border-radius:14px;padding:12px;cursor:pointer;
                                border:1.5px solid ${rar.color}40;
                                box-shadow:0 0 12px ${rar.glow};
                                transition:transform 0.15s;
                            ">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span style="font-size:1.5em;">${item.icon}</span>
                                    <div style="flex:1;min-width:0;">
                                        <div style="font-size:0.72em;font-weight:600;color:${rar.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
                                        <div style="font-size:0.62em;color:#475569;">${slotInfo.label}</div>
                                    </div>
                                </div>
                            </div>`;
                    } else {
                        return `
                            <div style="background:#0f0f0f;border-radius:14px;padding:12px;border:1.5px dashed #1e293b;opacity:0.6;">
                                <div style="display:flex;align-items:center;gap:8px;">
                                    <span style="font-size:1.5em;opacity:0.4;">${slotInfo.icon}</span>
                                    <div style="font-size:0.72em;color:#334155;">${slotInfo.label} vide</div>
                                </div>
                            </div>`;
                    }
                }).join('')}
            </div>
        </div>`;
}

function renderSetBonusesCard() {
    const bonuses = getSetBonuses();
    if (bonuses.length === 0) return '';

    const grouped = {};
    bonuses.forEach(b => {
        if (!grouped[b.set.id] || grouped[b.set.id].threshold < b.threshold) {
            grouped[b.set.id] = b;
        }
    });

    return `
        <div style="background:#141414;border-radius:16px;padding:14px;margin-bottom:14px;border:1px solid rgba(245,158,11,0.2);">
            <div style="font-size:0.72em;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">✨ Bonus de sets actifs</div>
            ${Object.values(grouped).map(({ set, bonus, count }) => `
                <div style="margin-bottom:8px;padding:10px;background:#0f0f0f;border-radius:10px;border-left:3px solid #f59e0b;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-weight:700;color:white;font-size:0.85em;">${set.icon} ${set.name}</span>
                        <span style="font-size:0.72em;color:#f59e0b;font-weight:700;">${count}/${set.pieces.length}</span>
                    </div>
                    <div style="font-size:0.75em;color:#4ade80;">${bonus.desc}</div>
                    ${bonus.special ? `<div style="font-size:0.72em;color:#a855f7;margin-top:3px;">⚡ ${bonus.special}</div>` : ''}
                </div>
            `).join('')}
        </div>`;
}

function renderInventoryCard() {
    const inv = getInventory();
    const equipped = getEquipped();
    const equippedIds = new Set(Object.values(equipped).filter(Boolean));

    if (inv.length === 0) {
        return `
            <div style="background:#141414;border-radius:16px;padding:24px;text-align:center;border:1px solid #1e293b;">
                <div style="font-size:2.5em;margin-bottom:10px;">🎒</div>
                <div style="font-weight:700;color:#e2e8f0;margin-bottom:6px;">Inventaire vide</div>
                <div style="font-size:0.82em;color:#475569;">Complète une séance pour obtenir ton premier équipement !</div>
            </div>`;
    }

    return `
        <div style="background:#141414;border-radius:16px;padding:14px;border:1px solid #1e293b;">
            <div style="font-size:0.72em;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">🎒 Inventaire (${inv.length} items)</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${inv.map(entry => {
                    const item = getItemById(entry.itemId);
                    if (!item) return '';
                    const rar = getRarityInfo(item.rarity);
                    const isEquipped = equippedIds.has(entry.id);
                    return `
                        <div onclick="showItemDetail('${item.id}','inventory',${entry.id})"
                             style="display:flex;align-items:center;gap:12px;padding:10px 12px;
                                    background:#0f0f0f;border-radius:12px;cursor:pointer;
                                    border:1px solid ${isEquipped ? rar.color + '60' : '#1e293b'};
                                    transition:border-color 0.15s;">
                            <span style="font-size:1.6em;">${item.icon}</span>
                            <div style="flex:1;min-width:0;">
                                <div style="font-size:0.85em;font-weight:700;color:${rar.color};">${item.name}</div>
                                <div style="font-size:0.7em;color:#475569;">${SLOTS[item.slot]?.label || item.slot} · ${rar.label}</div>
                            </div>
                            ${isEquipped ? `<span style="font-size:0.65em;background:rgba(34,197,94,0.15);color:#4ade80;padding:3px 8px;border-radius:99px;font-weight:700;white-space:nowrap;">Équipé</span>` : ''}
                        </div>`;
                }).join('')}
            </div>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL DÉTAIL ITEM
// ═══════════════════════════════════════════════════════════════════════

function showItemDetail(itemId, context, inventoryEntryId) {
    const item = getItemById(itemId);
    if (!item) return;
    const rar = getRarityInfo(item.rarity);
    const set = item.set ? getSetById(item.set) : null;
    const equipped = getEquipped();
    const isEquipped = Object.values(equipped).includes(inventoryEntryId);

    const modal = document.createElement('div');
    modal.id = 'itemDetailModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10000;
        background:rgba(0,0,0,0.85);
        display:flex;align-items:flex-end;justify-content:center;
        padding:16px;
        animation:fadeIn 0.2s ease;
    `;

    modal.innerHTML = `
        <div style="
            width:100%;max-width:420px;
            background:#141414;border-radius:24px 24px 20px 20px;
            padding:20px;
            border:1.5px solid ${rar.color}40;
            box-shadow:0 0 40px ${rar.glow};
            animation:slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1);
        ">
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
                <div style="font-size:2.8em;line-height:1;">${item.icon}</div>
                <div>
                    <div style="font-size:1.1em;font-weight:900;color:white;">${item.name}</div>
                    <div style="display:flex;gap:6px;margin-top:4px;">
                        <span style="font-size:0.65em;font-weight:700;padding:2px 8px;border-radius:99px;background:${rar.color}20;color:${rar.color};border:1px solid ${rar.color}40;">${rar.label}</span>
                        <span style="font-size:0.65em;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(255,255,255,0.05);color:#94a3b8;">${SLOTS[item.slot]?.label}</span>
                    </div>
                </div>
                <button onclick="document.getElementById('itemDetailModal').remove()"
                        style="margin-left:auto;background:rgba(255,255,255,0.06);border:none;color:#64748b;width:32px;height:32px;border-radius:50%;font-size:1em;cursor:pointer;">✕</button>
            </div>

            <!-- Description -->
            <div style="font-size:0.82em;color:#94a3b8;margin-bottom:14px;line-height:1.5;">${item.description}</div>

            <!-- Stats -->
            <div style="background:#0f0f0f;border-radius:12px;padding:12px;margin-bottom:14px;">
                <div style="font-size:0.65em;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Statistiques</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                    ${[
                        {key:'strength',  label:'Force',     icon:'⚔️', color:'#ef4444'},
                        {key:'agility',   label:'Agilité',   icon:'⚡', color:'#f59e0b'},
                        {key:'endurance', label:'Endurance', icon:'💚', color:'#22c55e'},
                        {key:'vitality',  label:'Vitalité',  icon:'💙', color:'#3b82f6'},
                    ].map(s => `
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:0.9em;">${s.icon}</span>
                            <span style="font-size:0.75em;color:#64748b;">${s.label}</span>
                            <span style="font-size:0.85em;font-weight:700;color:${s.color};margin-left:auto;">+${item.stats[s.key]}</span>
                        </div>`).join('')}
                </div>
            </div>

            <!-- Set info -->
            ${set ? `
                <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:10px 12px;margin-bottom:14px;">
                    <div style="font-size:0.72em;color:#f59e0b;font-weight:700;margin-bottom:4px;">${set.icon} Set : ${set.name}</div>
                    <div style="font-size:0.72em;color:#64748b;">${set.description}</div>
                </div>` : ''}

            <!-- Lore -->
            <div style="font-size:0.75em;color:#334155;font-style:italic;text-align:center;margin-bottom:16px;padding:0 8px;">${item.lore}</div>

            <!-- Actions -->
            ${context === 'inventory' && inventoryEntryId ? `
                <div style="display:flex;gap:8px;">
                    ${isEquipped ? `
                        <button onclick="unequipSlot('${item.slot}');renderAdventureTab();document.getElementById('itemDetailModal').remove();"
                                style="flex:1;padding:13px;border-radius:14px;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-weight:700;cursor:pointer;font-size:0.88em;">
                            ✕ Déséquiper
                        </button>` : `
                        <button onclick="equipItem(${inventoryEntryId});renderAdventureTab();document.getElementById('itemDetailModal').remove();"
                                style="flex:2;padding:13px;border-radius:14px;background:linear-gradient(135deg,${rar.color},${rar.color}cc);border:none;color:white;font-weight:800;cursor:pointer;font-size:0.88em;box-shadow:0 4px 16px ${rar.glow};">
                            ⚔️ Équiper
                        </button>`}
                </div>` : ''}
        </div>
        <style>
            @keyframes slideUp {
                from { transform: translateY(40px); opacity: 0; }
                to   { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL DROP — affiché après une séance
// ═══════════════════════════════════════════════════════════════════════

function showDropModal(item, rarityInfo) {
    if (!item) return;

    const modal = document.createElement('div');
    modal.id = 'dropModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10001;
        background:rgba(0,0,0,0.9);
        display:flex;align-items:center;justify-content:center;
        padding:20px;
        animation:fadeIn 0.3s ease;
    `;

    modal.innerHTML = `
        <div style="
            width:100%;max-width:360px;
            background:#141414;border-radius:24px;
            padding:28px 24px;text-align:center;
            border:2px solid ${rarityInfo.color};
            box-shadow:0 0 60px ${rarityInfo.glow}, 0 0 120px ${rarityInfo.glow}50;
            animation:dropPop 0.5s cubic-bezier(0.34,1.56,0.64,1);
        ">
            <div style="font-size:0.7em;color:${rarityInfo.color};font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-bottom:16px;">
                ✦ Item obtenu ✦
            </div>
            <div style="font-size:4em;margin-bottom:12px;animation:iconBounce 0.6s ease 0.2s both;">${item.icon}</div>
            <div style="font-size:1.2em;font-weight:900;color:white;margin-bottom:6px;">${item.name}</div>
            <div style="display:inline-block;font-size:0.7em;font-weight:700;padding:3px 12px;border-radius:99px;background:${rarityInfo.color}20;color:${rarityInfo.color};border:1px solid ${rarityInfo.color}40;margin-bottom:14px;">${rarityInfo.label}</div>
            <div style="font-size:0.8em;color:#64748b;margin-bottom:20px;line-height:1.5;">${item.description}</div>
            <button onclick="document.getElementById('dropModal').remove();"
                    style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                           background:linear-gradient(135deg,${rarityInfo.color},${rarityInfo.color}cc);
                           color:white;font-size:0.95em;font-weight:800;
                           box-shadow:0 4px 20px ${rarityInfo.glow};">
                🎒 Ajouter à l'inventaire
            </button>
        </div>
        <style>
            @keyframes dropPop {
                from { transform: scale(0.7); opacity: 0; }
                to   { transform: scale(1); opacity: 1; }
            }
            @keyframes iconBounce {
                0%   { transform: scale(0); }
                60%  { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
        </style>
    `;

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    // Vibration épique
    if (navigator.vibrate) {
        if (rarityInfo.id === 'legendary') navigator.vibrate([100,50,100,50,200]);
        else if (rarityInfo.id === 'epic')  navigator.vibrate([80,40,120]);
        else                                navigator.vibrate([60]);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// TOGGLE ADVENTURE MODE
// ═══════════════════════════════════════════════════════════════════════

function toggleAdventureMode() {
    const current = getAdventureEnabled();
    setAdventureEnabled(!current);
    renderAdventureTab();
    if (!current) {
        showToast('⚔️ Mode aventure activé ! Entraîne-toi pour obtenir des équipements.', 'success', 3500);
    }
}

// Init au chargement
function initAdventureSystem() {
    adventureEnabled = getAdventureEnabled();
}
