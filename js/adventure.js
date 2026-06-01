// ═══════════════════════════════════════════════════════════════════════
// Awakened — Système d'Aventure v2 (Solo Leveling)
// ═══════════════════════════════════════════════════════════════════════
(function() {
'use strict';

// 🚹🚺 Icônes SVG silhouette homme / femme (pour le bouton de changement d'avatar)
const GENDER_SVG = {
    homme: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2.5"/><path d="M9 9h6a1 1 0 0 1 1 1v5h-2v6h-4v-6H8v-5a1 1 0 0 1 1-1z"/></svg>`,
    femme: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2.5"/><path d="M12 8c-2 0-3 1.2-3.5 3l-1.3 5h2.3l.5 5h4l.5-5h2.3l-1.3-5C15 9.2 14 8 12 8z"/></svg>`
};

// RARITIES locaux (étendus) — indépendants de items.js
const RARITIES = {
    common:    { id:'common',    label:'E', labelFull:'Commun',     color:'#94a3b8', bg:'rgba(148,163,184,0.10)', glow:'rgba(148,163,184,0.18)', dropRate:0.60 },
    uncommon:  { id:'uncommon',  label:'D', labelFull:'Peu Commun', color:'#22c55e', bg:'rgba(34,197,94,0.10)',   glow:'rgba(34,197,94,0.26)',   dropRate:0.40 },
    rare:      { id:'rare',      label:'C', labelFull:'Rare',       color:'#3b82f6', bg:'rgba(59,130,246,0.10)',  glow:'rgba(59,130,246,0.28)',  dropRate:0.28 },
    superior:  { id:'superior',  label:'B', labelFull:'Supérieur',  color:'#06b6d4', bg:'rgba(6,182,212,0.10)',   glow:'rgba(6,182,212,0.34)',   dropRate:0.18 },
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
// ── Rang chasseur et rang item sur la même échelle ────────────────────
// Chasseur : E=0, D=1, C=2, B=3, A=4, S=5
// Items    : common→E(0), uncommon→D(1), rare→C(2), superior→B(3), epic→A(4), legendary→S(5)
// Règle    : item_rank <= hunter_rank + 2
function getHunterRankIndex() {
    const rpgData = (typeof rpgLoad === 'function') ? rpgLoad() : {};
    const totalXP = Object.values(rpgData.muscles || {}).reduce((s,m) => s + (m.xp||0), 0);
    const level   = (typeof rpgLevelFromXP === 'function') ? rpgLevelFromXP(totalXP) : 1;
    // Seuils alignés : E=1, D=10, C=20, B=35, A=55, S=80, SS=120, SSS=200
    return level < 10  ? 0 :
           level < 20  ? 1 :
           level < 35  ? 2 :
           level < 55  ? 3 :
           level < 80  ? 4 :
           level < 120 ? 5 :
           level < 200 ? 6 : 7;
}

function getItemRankValue(rarity) {
    return { common: 0, uncommon: 1, rare: 2, superior: 3, epic: 4, legendary: 5 }[rarity] || 0;
}

// Niveau de muscle minimum requis par rareté
const MUSCLE_LEVEL_REQ = { common: 1, uncommon: 3, rare: 5, superior: 8, epic: 12, legendary: 25 };

// Noms de muscles français → clés dans rpgLoad().muscles
const MUSCLE_FR_MAP = {
    'Pectoraux':'Pectoraux','Dos':'Dos','Quadriceps':'Quadriceps','Fessiers':'Fessiers',
    'Abdominaux':'Abdominaux','Épaules':'Épaules','Biceps':'Biceps','Triceps':'Triceps',
    'Ischio-jambiers':'Ischio-jambiers','Mollets':'Mollets','Trapèzes':'Trapèzes',
    'Avant-bras':'Avant-bras','Obliques':'Obliques','Cardio':'Cardio',
};

function getMuscleLevel(muscleName) {
    if (typeof rpgLoad !== 'function' || typeof rpgLevelFromXP !== 'function') return 1;
    const rpgData = rpgLoad();
    const muscles = rpgData.muscles || {};

    if (muscleName === 'Corps entier') {
        // Utiliser le niveau du muscle le plus haut
        const levels = Object.values(muscles).map(m => rpgLevelFromXP(m.xp || 0));
        return levels.length ? Math.max(...levels) : 1;
    }

    const key = MUSCLE_FR_MAP[muscleName] || muscleName;
    const m = muscles[key];
    return m ? rpgLevelFromXP(m.xp || 0) : 0;
}

function canEquipItem(item) {
    // Condition 1 : rang du chasseur
    const hunterRank = getHunterRankIndex();
    const itemRank   = getItemRankValue(item.rarity);
    if (itemRank > hunterRank + 2) return false;

    // Condition 2 : niveau du muscle lié
    const reqLevel    = MUSCLE_LEVEL_REQ[item.rarity] || 1;
    const muscleLevel = getMuscleLevel(item.muscle);
    if (muscleLevel < reqLevel) return false;

    return true;
}

// Retourne les détails du blocage (null si équipable)
function getEquipBlockReason(item) {
    const hunterRankIndex = getHunterRankIndex();
    const itemRank        = getItemRankValue(item.rarity);
    const hunterNames     = ['E','D','C','B','A','S','SS','SSS','National'];

    if (itemRank > hunterRankIndex + 2) {
        const minHunterRank = Math.max(0, itemRank - 2);
        return {
            reason: 'rank_too_low',
            label:  `Rang chasseur ${hunterNames[minHunterRank]} requis`,
            detail: `Ton rang : ${hunterNames[hunterRankIndex]} · Requis : ${hunterNames[minHunterRank]}`,
        };
    }

    const reqLevel    = MUSCLE_LEVEL_REQ[item.rarity] || 1;
    const muscleLevel = getMuscleLevel(item.muscle);
    if (muscleLevel < reqLevel) {
        const muscleName = item.muscle === 'Corps entier' ? 'ton meilleur muscle' : item.muscle;
        return {
            reason: 'muscle_too_weak',
            label:  `${muscleName} niv. ${reqLevel} requis`,
            detail: `${muscleName} : niv. ${muscleLevel} · Requis : niv. ${reqLevel}`,
        };
    }

    return null;
}

function getItemRankValue(rarity) {
    // Rang d'item sur l'échelle : E=0, D=1, C=2, B=3, A=4, S=5
    return { common: 0, uncommon: 1, rare: 2, superior: 3, epic: 4, legendary: 5 }[rarity] || 0;
}

function getRequiredRankLabel(rarity) {
    const itemRank = getItemRankValue(rarity);
    const minHunterRank = Math.max(0, itemRank - 2);
    return ['E','D','C','B','A','S','SS','SSS','National'][minHunterRank] || 'E';
}

function equipItem(invId) {
    const inv = getInventory();
    const entry = inv.find(e => e.id === invId);
    if (!entry) return { success: false, reason: 'Item introuvable' };
    const item = getItemById(entry.itemId);
    if (!item) return { success: false, reason: 'Item invalide' };

    const block = getEquipBlockReason(item);
    if (block) {
        return {
            success:   false,
            reason:    block.reason,
            label:     block.label,
            detail:    block.detail,
            itemName:  item.name,
        };
    }

    const eq = getEquipped();
    eq[item.slot] = invId;
    saveEquipped(eq);
    return { success: true };
}
function unequipSlot(slot) { const eq = getEquipped(); eq[slot] = null; saveEquipped(eq); }

// 🗑️ Supprimer un item de l'inventaire (irréversible)
function discardItem(invId) {
    const inv = getInventory();
    const entryIdx = inv.findIndex(e => e.id === invId);
    if (entryIdx === -1) return { success: false, reason: 'Item introuvable' };

    // Vérifier qu'il n'est pas équipé
    const eq = getEquipped();
    for (const slot of Object.keys(eq)) {
        if (eq[slot] === invId) {
            return { success: false, reason: 'Item équipé — déséquiper d\'abord' };
        }
    }

    const removed = inv.splice(entryIdx, 1)[0];
    saveInventory(inv);
    return { success: true, removed };
}
window.discardItem = discardItem;

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
    const stats = { STR:0, AGI:0, VIT:0, END:0, PER:0, SEN:0 };
    // 🌳 COMPÉTENCE equipPenaltyReduction (Peau de Fer) : atténue les stats négatives des équipements
    let _penaltyRed = 0;
    try {
        const sk = (typeof rpgGetActiveEffects === 'function') ? rpgGetActiveEffects() : {};
        _penaltyRed = Math.min(0.9, sk.equipPenaltyReduction || 0);
    } catch(e) {}
    for (const item of Object.values(eqItems)) {
        if (!item) continue;
        for (const [s,v] of Object.entries(item.stats||{})) {
            let val = v;
            if (val < 0 && _penaltyRed > 0) val = Math.ceil(val * (1 - _penaltyRed)); // malus réduit
            stats[s] = (stats[s]||0)+val;
        }
    }
    // ☠️ MALÉDICTION disableOtherPassives : annule les bonus de set
    let _disablePassives = false;
    try {
        for (const it of Object.values(eqItems)) {
            if (it && it.cursed && it.curse && (it.curse.type === 'disableOtherPassives')) { _disablePassives = true; break; }
        }
    } catch(e) {}
    if (!_disablePassives) {
        for (const {bonus} of setBonuses) {
            for (const [s,v] of Object.entries(bonus.stats||{})) stats[s] = (stats[s]||0)+v;
        }
    }
    // Ajouter les points de stats alloués par le joueur
    try {
        const sp = JSON.parse(localStorage.getItem('fitproStatPoints') || 'null');
        if (sp && sp.allocated) {
            for (const [s,v] of Object.entries(sp.allocated)) stats[s] = (stats[s]||0)+(v||0);
        }
    } catch(e) {}
    // Ajouter les bonus de stats permanents de la classe (évolution incluse)
    try {
        const classId = localStorage.getItem('fitproRPGClass');
        if (classId && typeof RPG_CLASSES !== 'undefined') {
            const cls = RPG_CLASSES.find(c => c.id === classId);
            if (cls) {
                // Récupérer l'évolution actuelle si disponible
                let statBonus = cls.statBonus || {};
                if (typeof CLASS_EVOLUTIONS !== 'undefined' && CLASS_EVOLUTIONS[classId]) {
                    const data = JSON.parse(localStorage.getItem('fitproRPG')||'{}');
                    const totalXP = Object.values(data.muscles||{}).reduce((s,m)=>s+(m.xp||0),0)
                                  + parseInt(localStorage.getItem('fitproRPGLifetimeXP')||'0');
                    const level = typeof rpgLevelFromXP === 'function' ? rpgLevelFromXP(totalXP) : 1;
                    const evos = CLASS_EVOLUTIONS[classId];
                    if (level >= 26 && evos[1]) statBonus = evos[1].statBonus;
                    else if (level >= 16 && evos[0]) statBonus = evos[0].statBonus;
                }
                for (const [s,v] of Object.entries(statBonus)) stats[s] = (stats[s]||0)+(v||0);
            }
        }
    } catch(e) {}
    // Ajouter les bonus de stats des compétences débloquées
    try {
        const unlocked = JSON.parse(localStorage.getItem('fitproRPGSkills') || '[]');
        if (typeof rpgGetSkillTree === 'function') {
            const tree = rpgGetSkillTree();
            tree.filter(s => unlocked.includes(s.id)).forEach(s => {
                if (s.effect && s.effect.statBonus) {
                    for (const [k,v] of Object.entries(s.effect.statBonus)) stats[k] = (stats[k]||0)+(v||0);
                }
            });
        }
    } catch(e) {}
    return stats;
}

// ── EFFETS DE MALÉDICTION ────────────────────────────────────────────────
// Agrège les effets `curse` des items maudits équipés.
function getActiveCurseEffects() {
    const eqItems = (typeof getEquippedItems === 'function') ? getEquippedItems() : {};
    const eff = {
        xpMalus: 0,            // réduction % d'XP (cumulé)
        lootMalus: 0,          // réduction % chance de loot
        healMalus: 0,          // réduction % régén HP
        bossWeak: 0,           // réduction % dégâts vs boss
        hpDrain: 0,            // % HP max drainé par vague
        backfire: 0,           // proba que l'attaque se retourne
        jam: 0,                // proba de coup perdu
        noXpChance: 0,         // proba qu'une série ne donne pas d'XP
        firstHitMiss: false,   // le 1er coup du combat rate
        noHealBetweenWaves: false,
        disableOtherPassives: false,
        labels: []             // descriptions actives (pour affichage)
    };
    for (const item of Object.values(eqItems)) {
        if (!item || !item.cursed || !item.curse) continue;
        const c = item.curse;
        // Effet principal
        switch (c.type) {
            case 'xpMalus':    eff.xpMalus   += (c.value || 0); break;
            case 'lootMalus':  eff.lootMalus += (c.value || 0); break;
            case 'healMalus':  eff.healMalus += (c.value || 0); break;
            case 'bossWeak':   eff.bossWeak  += (c.value || 0); break;
            case 'hpDrain':    eff.hpDrain   += (c.value || 0); break;
            case 'backfire':   eff.backfire   = Math.max(eff.backfire, c.value || 0); break;
            case 'jam':        eff.jam        = Math.max(eff.jam, c.value || 0); break;
            case 'noXpChance': eff.noXpChance = Math.max(eff.noXpChance, c.value || 0); break;
            case 'firstHitMiss':        eff.firstHitMiss = true; break;
            case 'noHealBetweenWaves':  eff.noHealBetweenWaves = true; break;
            case 'disableOtherPassives':eff.disableOtherPassives = true; break;
        }
        // Effets secondaires (items légendaires à double malédiction)
        if (c.xpMalus)   eff.xpMalus   += c.xpMalus;
        if (c.lootMalus) eff.lootMalus += c.lootMalus;
        if (c.label) eff.labels.push(c.label);
    }
    // Plafonner les malus % à 80% pour éviter les valeurs absurdes
    eff.xpMalus   = Math.min(0.8, eff.xpMalus);
    eff.lootMalus = Math.min(0.8, eff.lootMalus);
    eff.healMalus = Math.min(0.8, eff.healMalus);
    eff.bossWeak  = Math.min(0.8, eff.bossWeak);
    return eff;
}
window.getActiveCurseEffects = getActiveCurseEffects;

// ── EFFETS D'ANNEAUX ─────────────────────────────────────────────────────
// Agrège les `ringEffect` des accessoires équipés (combat + progression).
function getActiveRingEffects() {
    const eqItems = (typeof getEquippedItems === 'function') ? getEquippedItems() : {};
    const eff = {
        crit: 0,        // +% chance critique
        double: 0,      // +% chance double attaque
        dodge: 0,       // +% chance esquive
        bossDmg: 0,     // +% dégâts vs boss
        hpRegen: 0,     // +% régénération HP entre vagues
        xpGain: 0,      // +% XP gagnée
        lootChance: 0,  // +% chance de loot
        rareLoot: 0,    // +% chance de loot rare
        recovery: 0,    // -% temps de récupération musculaire
        questXp: 0,     // +% XP des quêtes
        firstShield: false, // encaisse le 1er coup
        compFailReduce: 0,  // -% risque d'échec missions compagnons
        compSpeed: 0,       // -% durée missions compagnons
        compStamina: 0,     // +% récup endurance compagnons
        labels: []
    };
    for (const item of Object.values(eqItems)) {
        if (!item || !item.ringEffect) continue;
        const e = item.ringEffect;
        switch (e.type) {
            case 'crit':        eff.crit       += e.value; break;
            case 'double':      eff.double     += e.value; break;
            case 'dodge':       eff.dodge      += e.value; break;
            case 'bossDmg':     eff.bossDmg    += e.value; break;
            case 'hpRegen':     eff.hpRegen    += e.value; break;
            case 'xpGain':      eff.xpGain     += e.value; break;
            case 'lootChance':  eff.lootChance += e.value; break;
            case 'rareLoot':    eff.rareLoot   += e.value; break;
            case 'recovery':    eff.recovery   += e.value; break;
            case 'questXp':     eff.questXp    += e.value; break;
            case 'firstShield': eff.firstShield = true; break;
            case 'compFailReduce': eff.compFailReduce += e.value; break;
            case 'compSpeed':      eff.compSpeed      += e.value; break;
            case 'compStamina':    eff.compStamina    += e.value; break;
            case 'compAll':
                eff.compFailReduce += e.value;
                eff.compSpeed      += e.value;
                eff.compStamina    += e.value;
                break;
        }
        if (e.label) eff.labels.push(e.label);
    }
    return eff;
}
window.getActiveRingEffects = getActiveRingEffects;



function tryEquipmentDrop(muscle, workoutQuality) {
    if (!getAdventureEnabled()) return null;
    const daily = getDailyDrops();
    if (daily.count >= MAX_DROPS_PER_DAY) return null;

    // ── Drop ultra-rare du Tome de l'Éveil (0.5%) ────────────────────
    // Conditions : avoir déjà une classe ET ne pas déjà avoir un tome
    try {
        const hasClass = !!localStorage.getItem('fitproRPGClass');
        const inv = getInventory();
        const hasTome = inv.some(e => e.itemId === 'tome_of_awakening');
        if (hasClass && !hasTome && Math.random() < 0.005) {
            const tome = EQUIPMENT_DATABASE.find(i => i.id === 'tome_of_awakening');
            if (tome) {
                inv.unshift({ itemId: tome.id, obtainedAt: new Date().toISOString(), id: Date.now() });
                saveInventory(inv);
                daily.count++;
                saveDailyDrops(daily);
                return { item: tome, rarity: RARITIES.legendary, qualityScore: 1.0, effectiveRank: 5, isSpecial: true };
            }
        }
    } catch(e) {}

    // ── Qualité de l'entraînement (0 à 1) ────────────────────────────
    // workoutQuality = { exerciseCount, durationSeconds, skipRatio }
    const wq = workoutQuality || {};
    const exCount    = Math.max(1, wq.exerciseCount || 1);
    const durationS  = Math.max(0, wq.durationSeconds || 0);
    const skipRatio  = Math.min(1, Math.max(0, wq.skipRatio || 0)); // 0 = aucun skip, 1 = tout skipé

    // Score basé sur le nombre d'exercices (1 ex = très faible, 8+ = max)
    const exScore = Math.min(1, (exCount - 1) / 7);

    // Score basé sur la durée (< 5min = très faible, 30min+ = max)
    const durationScore = Math.min(1, durationS / (30 * 60));

    // Malus de skip (0 = aucun malus, 1 = -70%)
    const skipMalus = 1 - (skipRatio * 0.70);

    // Score qualité final (0 à 1)
    const qualityScore = ((exScore * 0.4) + (durationScore * 0.6)) * skipMalus;

    // Chance de base qu'un drop se produise selon la qualité
    // Légère hausse : 1 exercice ~15%, entraînement complet ~85%
    let baseDrop = 0.15 + (qualityScore * 0.70);
    // 💍 ANNEAU : bonus de chance de loot
    if (typeof getActiveRingEffects === 'function') {
        const _r = getActiveRingEffects();
        if (_r.lootChance > 0) baseDrop = baseDrop * (1 + _r.lootChance);
    }
    // ☠️ MALÉDICTION : réduction de la chance de loot
    if (typeof getActiveCurseEffects === 'function') {
        const _c = getActiveCurseEffects();
        if (_c.lootMalus > 0) baseDrop = baseDrop * (1 - _c.lootMalus);
    }
    if (Math.random() > baseDrop) return null;

    // ── Rang du chasseur ──────────────────────────────────────────────
    const rpgData = (typeof rpgLoad === 'function') ? rpgLoad() : {};
    const totalXP = Object.values(rpgData.muscles || {}).reduce((s,m) => s + (m.xp||0), 0);
    const hunterLevel = (typeof rpgLevelFromXP === 'function') ? rpgLevelFromXP(totalXP) : 1;

    // Seuils alignés sur le système de rang affiché : E=1, D=10, C=20, B=35, A=55, S=80, SS=120, SSS=200
    const hunterRankIndex = hunterLevel < 10  ? 0 :
                            hunterLevel < 20  ? 1 :
                            hunterLevel < 35  ? 2 :
                            hunterLevel < 55  ? 3 :
                            hunterLevel < 80  ? 4 :
                            hunterLevel < 120 ? 5 :
                            hunterLevel < 200 ? 6 : 7;

    // ── Table de probabilités par rang ────────────────────────────────
    // [common(E), uncommon(D), rare(C), superior(B), epic(A), legendary(S)]
    const rankTables = [
    //  [E,     D,     C,     B,     A,     S    ]
        [0.80,  0.16,  0.04,  0.00,  0.00,  0.00],  // E  (niv 1-9)
        [0.55,  0.28,  0.13,  0.04,  0.00,  0.00],  // D  (niv 10-19)
        [0.38,  0.28,  0.22,  0.10,  0.02,  0.00],  // C  (niv 20-34)
        [0.25,  0.24,  0.26,  0.16,  0.08,  0.01],  // B  (niv 35-54)
        [0.15,  0.18,  0.26,  0.22,  0.16,  0.03],  // A  (niv 55-79)
        [0.08,  0.13,  0.22,  0.25,  0.24,  0.08],  // S  (niv 80-119)
        [0.04,  0.08,  0.18,  0.25,  0.30,  0.15],  // SS (niv 120-199)
        [0.02,  0.05,  0.13,  0.22,  0.33,  0.25],  // SSS(niv 200+)
    ];

    // La qualité d'entraînement pousse vers les raretés plus hautes
    // qualityScore > 0.7 : +1 rang effectif (jusqu'à S)
    // qualityScore < 0.3 : -1 rang effectif (jusqu'à E)
    let effectiveRank = hunterRankIndex;
    if (qualityScore >= 0.75) effectiveRank = Math.min(7, effectiveRank + 1);
    else if (qualityScore <= 0.25) effectiveRank = Math.max(0, effectiveRank - 1);

    // 🎭 Phase 4 : Yuna Veilbreaker — rareLootBoost
    let rareLootMult = 1;
    let doubleDropChance = 0;
    try {
        if (typeof awakCompanionsGetActiveBonuses === 'function') {
            const compBonus = awakCompanionsGetActiveBonuses();
            if (compBonus.rareLootBoost) rareLootMult = 1 + compBonus.rareLootBoost;
            if (compBonus.doubleDropChance) doubleDropChance = compBonus.doubleDropChance;
        }
    } catch(e) {}

    // 🌀 SEN : bonus chance de loot rare (depuis les stats joueur)
    try {
        if (typeof window.awakComputeStatBonuses === 'function') {
            const bonuses = window.awakComputeStatBonuses();
            if (bonuses.rareLootBonus > 0) {
                rareLootMult += bonuses.rareLootBonus;
            }
        }
    } catch(e) {}

    const baseTable = rankTables[effectiveRank];
    // Si Yuna est active, redistribuer les probas vers les hautes raretés
    const table = rareLootMult > 1
        ? baseTable.map((p, idx) => {
            // Renforcer rare/epic/legendary et réduire common
            if (idx === 0) return p / rareLootMult;
            return p * rareLootMult;
        })
        : baseTable;
    // Re-normaliser
    if (rareLootMult > 1) {
        const sum = table.reduce((s,v) => s+v, 0);
        for (let i = 0; i < table.length; i++) table[i] = table[i] / sum;
    }

    // Tirage de la rareté
    const roll = Math.random();
    let cumul = 0;
    const rarityOrder = ['common', 'uncommon', 'rare', 'superior', 'epic', 'legendary'];
    let rarity = 'common';
    for (let i = 0; i < rarityOrder.length; i++) {
        cumul += table[i];
        if (roll <= cumul) { rarity = rarityOrder[i]; break; }
    }

    // 🌳 COMPÉTENCES : amélioration de rareté selon les skills débloqués
    try {
        const sk = (typeof rpgGetActiveEffects === 'function') ? rpgGetActiveEffects() : {};
        // epicDropBonus : chance de promouvoir un drop rare/superior vers épique
        if (sk.epicDropBonus && (rarity === 'rare' || rarity === 'superior') && Math.random() < sk.epicDropBonus) {
            rarity = 'epic';
        }
        // legendaryDropBonus : chance de promouvoir un épique vers légendaire
        if (sk.legendaryDropBonus && rarity === 'epic' && Math.random() < sk.legendaryDropBonus) {
            rarity = 'legendary';
        }
        // epicToLegendary : un drop épique devient légendaire
        if (sk.epicToLegendary && rarity === 'epic' && Math.random() < sk.epicToLegendary) {
            rarity = 'legendary';
        }
    } catch(e) {}

    // ── Sélection de l'item ──────────────────────────────────────────
    // Les items 'riftOnly' ne droppent QUE dans les Failles (pas en séance normale).
    const allowRiftOnly = (typeof arguments !== 'undefined' && arguments.length > 0 && arguments[arguments.length-1] === 'rift');
    const dbPool = EQUIPMENT_DATABASE.filter(i => allowRiftOnly ? true : !i.riftOnly);
    const candidates = dbPool.filter(i =>
        i.rarity === rarity && (i.muscle === muscle || i.muscle === 'Corps entier')
    );
    const pool = candidates.length > 0 ? candidates : dbPool.filter(i => i.rarity === rarity);
    if (!pool.length) return null;

    const item = pool[Math.floor(Math.random() * pool.length)];
    const inv = getInventory();
    inv.unshift({ itemId: item.id, obtainedAt: new Date().toISOString(), id: Date.now() });
    saveInventory(inv);
    daily.count++;
    saveDailyDrops(daily);

    // Retourner aussi la qualité pour le modal
    return { item, rarity: RARITIES[rarity], qualityScore, effectiveRank };
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
    const rank = level<6?{r:'E',c:'#6b7280'}:level<11?{r:'D',c:'#92400e'}:level<16?{r:'C',c:'#15803d'}:level<21?{r:'B',c:'#1d4ed8'}:level<26?{r:'A',c:'#7c3aed'}:level<31?{r:'S',c:'#d97706'}:level<36?{r:'SS',c:'#ea580c'}:level<41?{r:'SSS',c:'#be185d'}:{r:'National',c:'#f59e0b'};
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
        <!-- Header épuré : juste Équipement + Drops -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div>
                <div style="font-size:0.58em;color:rgba(168,85,247,0.7);font-weight:900;letter-spacing:2px;">◈ ÉQUIPEMENT</div>
                <div style="font-size:0.95em;font-weight:800;color:white;margin-top:2px;">Stats d'équipement</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.58em;color:rgba(255,255,255,0.3);font-weight:700;letter-spacing:1px;">DROPS / JOUR</div>
                <div style="font-size:1em;font-weight:900;color:${daily.count<MAX_DROPS_PER_DAY?'#a855f7':'#334155'};">${daily.count}/${MAX_DROPS_PER_DAY}</div>
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

// ═══════════════════════════════════════════════════════════════
// 🎭 AVATAR : Choix homme / femme
// ═══════════════════════════════════════════════════════════════
function toggleAvatarGender() {
    const current = localStorage.getItem('fitproAvatarGender') || 'homme';
    const next = current === 'homme' ? 'femme' : 'homme';
    localStorage.setItem('fitproAvatarGender', next);

    // Toast de confirmation
    if (typeof showToast === 'function') {
        const emoji = next === 'femme' ? '👩' : '👨';
        showToast(`${emoji} Avatar : ${next === 'femme' ? 'Femme' : 'Homme'}`, 'info', 1800);
    }

    // Re-render le VRAI modal d'équipement (rpgEquipModal)
    const rpgModal = document.getElementById('rpgEquipModal');
    if (rpgModal && typeof showRPGEquipmentModal === 'function') {
        // Récupérer l'onglet actif courant (equip/inventory)
        const activeTab = rpgModal.dataset.currentTab || 'equip';
        rpgModal.remove();
        showRPGEquipmentModal(activeTab);
    }
}
window.toggleAvatarGender = toggleAvatarGender;

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
    // 🎭 Avatar : Homme ou Femme (selon préférence utilisateur)
    const avatarGender = localStorage.getItem('fitproAvatarGender') || 'homme';
    const avatarPath = avatarGender === 'femme'
        ? 'images/avatars/avatar_femme.png'
        : 'images/avatars/avatar_homme.png';

    const silhouette = `
        <div style="position:relative;width:130px;height:230px;display:flex;align-items:center;justify-content:center;">
            <img src="${avatarPath}"
                 alt="Avatar ${avatarGender}"
                 style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 0 12px rgba(6,182,212,0.4));"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
            <!-- Fallback si image ne charge pas -->
            <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:rgba(6,182,212,0.5);font-size:0.7em;text-align:center;">Avatar non disponible</div>

            <!-- Bouton toggle homme/femme -->
            <button onclick="toggleAvatarGender()" style="position:absolute;top:-6px;right:-6px;background:rgba(6,182,212,0.18);border:1px solid rgba(6,182,212,0.45);color:#67e8f9;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(6,182,212,0.3);" title="Changer d'avatar">${avatarGender === 'femme' ? GENDER_SVG.homme : GENDER_SVG.femme}</button>
        </div>`;

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
                ${[['⚔️','STR',eqStats.STR||0,'#ef4444'],['⚡','AGI',eqStats.AGI||0,'#f59e0b'],['💚','END',eqStats.END||0,'#22c55e'],['💙','VIT',eqStats.VIT||0,'#3b82f6'],['👁️','PER',eqStats.PER||0,'#06b6d4'],['🌀','SEN',eqStats.SEN||0,'#a855f7']].map(([icon,label,val,c])=>`
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
    // 🌌 AWAKENED Power Card est maintenant fusionnée dans la carte Profil (renderGameTab)
    // 🌀 Failles actives
    const riftsCard = (typeof window.renderActiveRiftsCard === 'function')
        ? window.renderActiveRiftsCard() : '';
    // 👹 Monstres échappés (Phase 3)
    const monstersCard = (typeof window.renderEscapedMonstersCard === 'function')
        ? window.renderEscapedMonstersCard() : '';
    // 🎭 Compagnons (Phase 4)
    const companionsCard = (typeof window.renderCompanionsCard === 'function')
        ? window.renderCompanionsCard() : '';
    // 🧪 Consommables (Phase 5)
    const consumablesCard = (typeof window.renderConsumablesCard === 'function')
        ? window.renderConsumablesCard() : '';
    container.innerHTML = monstersCard
        + riftsCard
        + companionsCard
        + consumablesCard
        + (typeof renderChallengeSection==='function' ? renderChallengeSection() : '');
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
                ${[['⚔️','STR','STR','#ef4444'],['⚡','AGI','AGI','#f59e0b'],['💚','END','END','#22c55e'],['💙','VIT','VIT','#3b82f6'],['👁️','PER','PER','#06b6d4'],['🌀','SEN','SEN','#a855f7']].map(([icon,label,key,c])=>`
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
            `<button onclick="tryEquipWithFeedback(${invId},function(){document.getElementById('itemDetailModal')?.remove();});" style="flex:1;padding:13px;border-radius:13px;background:linear-gradient(135deg,${r.color},${r.color}bb);border:none;color:white;font-weight:800;cursor:pointer;font-size:0.85em;box-shadow:0 4px 14px ${r.glow};">⚔️ Équiper</button>`
        }</div>` : `<button onclick="document.getElementById('itemDetailModal').remove();" style="width:100%;padding:12px;border-radius:12px;background:#0a0a0a;border:1px solid #1a1a1a;color:#334155;font-weight:700;cursor:pointer;font-size:0.82em;">Fermer</button>`}
    </div><style>@keyframes slideUpModal{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}</style>`;
    modal.addEventListener('click', e=>{ if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
}

function showDropModal(item, rarityInfo, qualityScore) {
    if (!item) return;
    document.getElementById('dropModal')?.remove();

    const qScore = Math.round((qualityScore || 0.5) * 100);
    const qColor = qScore >= 75 ? '#22c55e' : qScore >= 50 ? '#f59e0b' : '#94a3b8';
    const qLabel = qScore >= 75 ? '⭐ Excellent' : qScore >= 50 ? '👍 Bon' : qScore >= 25 ? '😐 Faible' : '⚠️ Très faible';
    const qBars  = Math.round(qScore / 20); // 0 à 5 barres

    const modal = document.createElement('div');
    modal.id = 'dropModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `<div style="width:100%;max-width:320px;background:#0a0a0a;border-radius:22px;padding:26px 18px;text-align:center;border:2px solid ${rarityInfo.color};box-shadow:0 0 60px ${rarityInfo.glow},0 0 120px ${rarityInfo.glow}40;animation:dropPop 0.5s cubic-bezier(0.34,1.56,0.64,1);">
        <div style="font-size:0.58em;color:${rarityInfo.color};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">✦ ITEM OBTENU · RANG ${rarityInfo.label} ✦</div>
        <div style="font-size:4em;margin-bottom:8px;filter:drop-shadow(0 0 18px ${rarityInfo.glow});animation:iconBounce 0.6s ease 0.15s both;">${item.icon}</div>
        <div style="font-size:1.1em;font-weight:900;color:white;margin-bottom:4px;">${item.name}</div>
        <div style="font-size:0.68em;padding:2px 10px;border-radius:99px;background:${rarityInfo.bg};color:${rarityInfo.color};border:1px solid ${rarityInfo.color}38;display:inline-block;margin-bottom:10px;font-weight:800;">${rarityInfo.labelFull}</div>
        <div style="font-size:0.75em;color:#334155;margin-bottom:8px;line-height:1.5;">${item.description}</div>
        ${item.passive ? `<div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.18);border-radius:8px;padding:7px 10px;margin-bottom:10px;"><span style="font-size:0.62em;color:#22c55e;font-weight:700;text-transform:uppercase;letter-spacing:1px;">⚡ Passif</span><div style="font-size:0.7em;color:#4ade80;margin-top:2px;line-height:1.4;">${item.passive}</div></div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px;">
            ${[['⚔️','STR','STR','#ef4444'],['⚡','AGI','AGI','#f59e0b'],['💚','END','END','#22c55e'],['💙','VIT','VIT','#3b82f6'],['👁️','PER','PER','#06b6d4'],['🌀','SEN','SEN','#a855f7']].map(([icon,label,key,c])=>`<div style="background:#111;border-radius:7px;padding:5px;border:1px solid #1a1a1a;"><span style="font-size:0.72em;">${icon}</span><span style="font-size:0.62em;color:#1e293b;"> ${label} </span><span style="font-size:0.75em;font-weight:800;color:${c};">+${item.stats[key]||0}</span></div>`).join('')}
        </div>
        <!-- Qualité de l'entraînement -->
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:10px 12px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.65em;color:#334155;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Qualité séance</span>
                <span style="font-size:0.7em;color:${qColor};font-weight:800;">${qLabel}</span>
            </div>
            <div style="display:flex;gap:3px;">
                ${Array.from({length:5}, (_,i) => `<div style="flex:1;height:5px;border-radius:99px;background:${i < qBars ? qColor : '#1e293b'};"></div>`).join('')}
            </div>
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
// ═══════════════════════════════════════════════════════════════════════
// 🎯 POPUP DÉTAIL ITEM — par-dessus le modal d'équipement
// ═══════════════════════════════════════════════════════════════════════
function showItemPopup(item, invId, equippedSlot) {
    if (!item) return;
    document.getElementById('itemPopupModal')?.remove();

    const r = getRarityInfo(item.rarity);
    const block = getEquipBlockReason(item);
    const isEquipped = equippedSlot !== null && equippedSlot !== undefined;
    const set = item.set ? getSetById(item.set) : null;

    const modal = document.createElement('div');
    modal.id = 'itemPopupModal';
    modal.className = 'modal active';
    modal.style.cssText = `position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:16px;animation:awakFadeIn 0.25s;`;

    // Stats à afficher (positives ET négatives pour les items maudits)
    const stats = Object.entries(item.stats || {}).filter(([_,v]) => v !== 0);

    modal.innerHTML = `
        <div style="max-width:380px;width:100%;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1.5px solid ${r.color}55;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.6),0 0 40px ${r.glow};animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);">

            <!-- Header rareté -->
            <div style="background:linear-gradient(135deg,${r.color}25,${r.color}05);padding:18px 20px;text-align:center;border-bottom:1px solid ${r.color}30;position:relative;">
                <button onclick="document.getElementById('itemPopupModal').remove()" style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;cursor:pointer;font-size:0.9em;font-weight:700;display:flex;align-items:center;justify-content:center;">✕</button>

                <div style="font-size:3em;line-height:1;margin-bottom:8px;filter:drop-shadow(0 0 14px ${r.glow});">${item.icon}</div>
                <div style="font-weight:900;color:white;font-size:1.05em;line-height:1.3;margin-bottom:4px;">${item.name}</div>
                <div style="display:inline-block;background:${r.color}25;color:${r.color};border:1px solid ${r.color}50;padding:2px 8px;border-radius:6px;font-size:0.6em;font-weight:900;letter-spacing:1.5px;">${(r.labelFull || r.label || '').toUpperCase()}</div>
                ${isEquipped ? `<div style="margin-top:6px;display:inline-block;background:rgba(34,197,94,0.18);color:#4ade80;border:1px solid rgba(34,197,94,0.35);padding:2px 8px;border-radius:6px;font-size:0.62em;font-weight:800;letter-spacing:1px;">✓ ÉQUIPÉ</div>` : ''}
            </div>

            <!-- Corps -->
            <div style="padding:16px 20px;">
                <!-- Description -->
                <div style="font-size:0.78em;color:#cbd5e1;line-height:1.55;font-style:italic;margin-bottom:14px;text-align:center;">${item.description || ''}</div>

                <!-- Passif / Malédiction -->
                ${item.passive ? `
                <div style="background:${item.cursed?'rgba(168,85,247,0.10)':'rgba(34,197,94,0.08)'};border:1px solid ${item.cursed?'rgba(168,85,247,0.35)':'rgba(34,197,94,0.25)'};border-radius:10px;padding:10px 12px;margin-bottom:12px;">
                    <div style="font-size:0.58em;color:${item.cursed?'#c084fc':'#22c55e'};font-weight:900;letter-spacing:2px;margin-bottom:4px;">${item.cursed?'☠️ MALÉDICTION':'⚡ EFFET PASSIF'}</div>
                    <div style="font-size:0.8em;color:${item.cursed?'#d8b4fe':'#4ade80'};line-height:1.4;font-weight:600;">${item.passive}</div>
                    ${item.cursed && item.curse && item.curse.label ? `<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(168,85,247,0.2);font-size:0.72em;color:#f0abfc;font-weight:700;display:flex;align-items:center;gap:5px;"><span>⚠️</span> ${item.curse.label}</div>` : ''}
                </div>` : ''}

                <!-- 💍 Effet d'anneau -->
                ${item.ringEffect ? (() => {
                    const isCmd = ['compFailReduce','compSpeed','compStamina','compAll'].includes(item.ringEffect.type);
                    const ec = isCmd ? '#f5b942' : '#22d3ee';
                    const ecLight = isCmd ? '#fcd34d' : '#67e8f9';
                    const ecBg = isCmd ? 'rgba(245,185,66,0.10)' : 'rgba(34,211,238,0.08)';
                    const ecBd = isCmd ? 'rgba(245,185,66,0.4)' : 'rgba(34,211,238,0.3)';
                    const label = isCmd ? '👑 ANNEAU DE COMMANDEMENT' : '💍 EFFET D\'ANNEAU';
                    return `<div style="background:${ecBg};border:1px solid ${ecBd};border-radius:10px;padding:10px 12px;margin-bottom:12px;">
                        <div style="font-size:0.58em;color:${ec};font-weight:900;letter-spacing:2px;margin-bottom:4px;">${label}</div>
                        <div style="font-size:0.85em;color:${ecLight};line-height:1.4;font-weight:800;">${item.ringEffect.label}</div>
                    </div>`;
                })() : ''}

                <!-- Stats -->
                ${stats.length > 0 ? `
                <div style="margin-bottom:12px;">
                    <div style="font-size:0.6em;color:#94a3b8;font-weight:800;letter-spacing:1.5px;margin-bottom:6px;">◈ STATISTIQUES</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
                        ${stats.map(([k,v]) => {
                            const neg = v < 0;
                            const av = Math.abs(v);
                            // 🎯 Effet combat de chaque stat
                            const effects = {
                                STR: `${neg?'-':'+'}${av}% dgts`,
                                AGI: `${neg?'-':'+'}${(av*0.5).toFixed(1)}% crit`,
                                VIT: `${neg?'-':'+'}${av}% × 2`,
                                END: `${neg?'-':'+'}${av*5} HP max`,
                                PER: `${neg?'-':'+'}${av}% vs boss`,
                                SEN: `${neg?'-':'+'}${av}% XP`
                            };
                            const effectText = effects[k] || '';
                            const statColor = neg ? '#f87171' : r.color;
                            const effColor = neg ? '#f87171' : '#4ade80';
                            return `
                            <div style="background:#0a0e18;border:1px solid ${neg?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.06)'};border-radius:8px;padding:6px 4px;text-align:center;">
                                <div style="font-size:0.55em;color:#64748b;font-weight:800;letter-spacing:0.5px;">${k}</div>
                                <div style="font-size:1em;color:${statColor};font-weight:900;line-height:1.1;">${neg?'':'+'}${v}</div>
                                ${effectText ? `<div style="font-size:0.48em;color:${effColor};font-weight:700;margin-top:2px;letter-spacing:0.3px;">${effectText}</div>` : ''}
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>` : ''}

                <!-- Set bonus -->
                ${set ? `
                <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.25);border-radius:10px;padding:10px 12px;margin-bottom:12px;">
                    <div style="font-size:0.58em;color:#c084fc;font-weight:900;letter-spacing:2px;margin-bottom:4px;">🏛️ SET — ${set.name.toUpperCase()}</div>
                    <div style="font-size:0.7em;color:#cbd5e1;line-height:1.4;">${set.description || ''}</div>
                </div>` : ''}

                <!-- Actions -->
                <div style="display:flex;gap:8px;margin-top:14px;">
                    ${isEquipped ? `
                        <button onclick="unequipSlot('${equippedSlot}');renderAdventureTab();document.getElementById('itemPopupModal').remove();if(typeof rebuild==='function')rebuild();" style="flex:1;padding:13px;border-radius:11px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171;font-weight:800;cursor:pointer;font-size:0.85em;">✕ Déséquiper</button>
                    ` : (invId !== null && invId !== undefined ? (block ? `
                        <button disabled style="flex:1;padding:13px;border-radius:11px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-weight:700;font-size:0.82em;">${block.reason === 'muscle_too_weak' ? '💪' : '🔒'} ${block.label}</button>
                    ` : `
                        <button onclick="tryEquipWithFeedback(${invId},function(){document.getElementById('itemPopupModal')?.remove();});" style="flex:1;padding:13px;border-radius:11px;background:linear-gradient(135deg,${r.color},${r.color}cc);border:none;color:white;font-weight:900;cursor:pointer;font-size:0.88em;letter-spacing:0.5px;box-shadow:0 4px 14px ${r.glow};">⚔️ ÉQUIPER</button>
                    `) : '')}
                </div>

                <!-- 🗑️ Bouton supprimer (seulement si non équipé et présent dans l'inventaire) -->
                ${(!isEquipped && invId !== null && invId !== undefined) ? `
                <button onclick="confirmDiscardItem(${invId}, '${(item.name || '').replace(/'/g, '\\\'')}', '${r.color}')" style="width:100%;margin-top:8px;padding:10px;border-radius:11px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-weight:800;cursor:pointer;font-size:0.78em;letter-spacing:0.5px;display:flex;align-items:center;justify-content:center;gap:6px;">
                    🗑️ Supprimer cet item
                </button>` : ''}

                <button onclick="document.getElementById('itemPopupModal').remove()" style="width:100%;margin-top:8px;padding:10px;border-radius:11px;background:transparent;border:1px solid rgba(255,255,255,0.08);color:#94a3b8;font-weight:700;cursor:pointer;font-size:0.78em;">Fermer</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    // Click outside to close
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });
}
window.showItemPopup = showItemPopup;

// 🗑️ Modal de confirmation pour la suppression d'un item
function confirmDiscardItem(invId, itemName, color) {
    document.getElementById('discardConfirmModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'discardConfirmModal';
    modal.className = 'modal active';
    modal.style.cssText = `position:fixed;inset:0;z-index:99995;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:awakFadeIn 0.2s;`;

    modal.innerHTML = `
        <div style="max-width:360px;width:100%;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1.5px solid rgba(239,68,68,0.5);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 40px rgba(239,68,68,0.2);animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);">

            <!-- Header rouge avec icône -->
            <div style="background:linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.05));padding:18px 20px;text-align:center;border-bottom:1px solid rgba(239,68,68,0.3);">
                <div style="font-size:2.6em;line-height:1;margin-bottom:6px;filter:drop-shadow(0 0 14px rgba(239,68,68,0.5));">🗑️</div>
                <div style="font-weight:900;color:white;font-size:1em;letter-spacing:0.5px;margin-bottom:4px;text-transform:uppercase;">SUPPRIMER L'ITEM ?</div>
                <div style="font-size:0.55em;color:#f87171;font-weight:900;letter-spacing:2.5px;text-transform:uppercase;">◈ ACTION IRRÉVERSIBLE ◈</div>
            </div>

            <!-- Corps -->
            <div style="padding:18px 20px;text-align:center;">
                <div style="font-size:0.85em;color:#cbd5e1;line-height:1.55;margin-bottom:12px;">Tu es sur le point de supprimer définitivement :</div>

                <div style="background:rgba(255,255,255,0.04);border:1px solid ${color}50;border-radius:10px;padding:12px;margin-bottom:14px;">
                    <div style="font-size:0.95em;font-weight:900;color:${color};line-height:1.3;">${itemName}</div>
                </div>

                <div style="font-size:0.72em;color:#f87171;font-weight:700;line-height:1.5;margin-bottom:16px;background:rgba(239,68,68,0.05);padding:8px 12px;border-radius:8px;border:1px solid rgba(239,68,68,0.2);">
                    ⚠️ Cette action ne peut pas être annulée. L'item sera perdu pour toujours.
                </div>

                <!-- Boutons -->
                <div style="display:flex;gap:8px;">
                    <button onclick="document.getElementById('discardConfirmModal').remove()" style="flex:1;padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;cursor:pointer;font-size:0.82em;letter-spacing:0.5px;">
                        ✕ Annuler
                    </button>
                    <button onclick="executeDiscardItem(${invId})" style="flex:1;padding:12px;border-radius:10px;background:linear-gradient(135deg,#dc2626,#ef4444);border:1px solid #ef4444;color:white;font-weight:900;cursor:pointer;font-size:0.85em;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 16px rgba(239,68,68,0.4);">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });
}
window.confirmDiscardItem = confirmDiscardItem;

// Exécute la suppression après confirmation
function executeDiscardItem(invId) {
    const inv = getInventory();
    const entry = inv.find(e => e.id === invId);
    const item = entry ? getItemById(entry.itemId) : null;
    const itemName = item ? item.name : 'Item';

    const result = discardItem(invId);

    // Ferme les modals
    document.getElementById('discardConfirmModal')?.remove();
    document.getElementById('itemPopupModal')?.remove();

    if (result.success) {
        if (typeof showToast === 'function') {
            showToast(`🗑️ "${itemName}" supprimé`, 'info', 2000);
        }
        if (typeof vibrate === 'function') vibrate([30, 20, 30]);

        // Re-render les vues
        if (typeof renderAdventureTab === 'function') renderAdventureTab();
        // Si on est dans le modal d'équipement, le re-render aussi
        const rpgModal = document.getElementById('rpgEquipModal');
        if (rpgModal && typeof showRPGEquipmentModal === 'function') {
            const activeTab = rpgModal.dataset.currentTab || 'inventory';
            rpgModal.remove();
            showRPGEquipmentModal(activeTab);
        }
    } else {
        if (typeof showToast === 'function') {
            showToast(`⚠️ ${result.reason || 'Impossible de supprimer'}`, 'error', 2500);
        }
    }
}
window.executeDiscardItem = executeDiscardItem;

// 🧹 Modal de nettoyage en masse de l'inventaire
function openInventoryCleanupModal() {
    document.getElementById('inventoryCleanupModal')?.remove();

    const inv = getInventory();
    const eq = getEquipped();
    const equippedIds = new Set(Object.values(eq).filter(Boolean));

    // Grouper les items par rareté (seulement non équipés)
    const byRarity = {};
    inv.forEach(entry => {
        if (equippedIds.has(entry.id)) return; // skip équipés
        const item = getItemById(entry.itemId);
        if (!item) return;
        const rarity = item.rarity || 'common';
        if (!byRarity[rarity]) byRarity[rarity] = [];
        byRarity[rarity].push({ entry, item });
    });

    // Ordre d'affichage des raretés
    const rarityOrder = ['common', 'uncommon', 'rare', 'superior', 'epic', 'legendary'];
    const rarityRows = rarityOrder
        .filter(rar => byRarity[rar] && byRarity[rar].length > 0)
        .map(rar => {
            const r = getRarityInfo(rar);
            const items = byRarity[rar];
            return `<div style="background:rgba(255,255,255,0.02);border:1px solid ${r.color}40;border-radius:10px;padding:10px 12px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="color:${r.color};font-weight:900;font-size:0.75em;letter-spacing:1.5px;text-transform:uppercase;">${r.labelFull || r.label || rar}</span>
                        <span style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#cbd5e1;padding:2px 7px;border-radius:99px;font-size:0.6em;font-weight:800;">${items.length}</span>
                    </div>
                    <button onclick="confirmBulkDiscard('${rar}', ${items.length})" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:6px;padding:4px 10px;font-size:0.62em;font-weight:900;cursor:pointer;letter-spacing:0.5px;">
                        🗑️ Tout supprimer
                    </button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:3px;">
                    ${items.slice(0, 10).map(({item}) => `<span style="font-size:1.1em;filter:drop-shadow(0 0 4px ${r.glow});">${item.icon}</span>`).join('')}
                    ${items.length > 10 ? `<span style="font-size:0.65em;color:#94a3b8;align-self:center;margin-left:4px;">+${items.length - 10}</span>` : ''}
                </div>
            </div>`;
        })
        .join('');

    const totalNonEquipped = Object.values(byRarity).reduce((s, arr) => s + arr.length, 0);

    const modal = document.createElement('div');
    modal.id = 'inventoryCleanupModal';
    modal.className = 'modal active';
    modal.style.cssText = `position:fixed;inset:0;z-index:99996;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;animation:awakFadeIn 0.25s;`;

    modal.innerHTML = `
        <div style="max-width:420px;width:100%;background:linear-gradient(160deg,#0a0e18,#0F1014);border:1.5px solid rgba(239,68,68,0.4);border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.7),0 0 40px rgba(239,68,68,0.15);max-height:85vh;display:flex;flex-direction:column;animation:slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.04));padding:16px 20px;border-bottom:1px solid rgba(239,68,68,0.3);position:relative;flex-shrink:0;">
                <button onclick="document.getElementById('inventoryCleanupModal').remove()" style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);color:#94a3b8;cursor:pointer;font-size:0.9em;font-weight:700;display:flex;align-items:center;justify-content:center;">✕</button>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-size:2em;line-height:1;filter:drop-shadow(0 0 10px rgba(239,68,68,0.4));">🧹</div>
                    <div>
                        <div style="font-size:0.95em;font-weight:900;color:white;line-height:1.2;text-transform:uppercase;letter-spacing:0.5px;">Nettoyage Inventaire</div>
                        <div style="font-size:0.62em;color:#f87171;font-weight:900;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">${totalNonEquipped} items non équipés</div>
                    </div>
                </div>
            </div>

            <!-- Corps scrollable -->
            <div style="padding:14px 16px;overflow-y:auto;flex:1;">
                ${rarityRows || `
                    <div style="text-align:center;padding:30px 20px;color:#94a3b8;font-size:0.85em;">
                        <div style="font-size:2.4em;margin-bottom:8px;opacity:0.6;">✨</div>
                        <div style="font-weight:700;">Inventaire propre !</div>
                        <div style="font-size:0.85em;color:#64748b;margin-top:4px;">Aucun item à nettoyer.</div>
                    </div>
                `}

                ${totalNonEquipped > 0 ? `
                <div style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px 12px;margin-top:8px;font-size:0.72em;color:#f87171;line-height:1.5;">
                    ⚠️ <strong>Action irréversible.</strong> Les items équipés sont protégés et ne peuvent pas être supprimés.
                </div>
                ` : ''}
            </div>

            <!-- Footer -->
            <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
                <button onclick="document.getElementById('inventoryCleanupModal').remove()" style="width:100%;padding:11px;border-radius:9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#cbd5e1;font-weight:800;cursor:pointer;font-size:0.82em;letter-spacing:0.5px;">
                    Fermer
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });
}
window.openInventoryCleanupModal = openInventoryCleanupModal;

// Confirmation pour suppression en masse par rareté
function confirmBulkDiscard(rarity, count) {
    const r = getRarityInfo(rarity);
    const rarityLabel = (r.labelFull || r.label || rarity).toUpperCase();

    const doDiscard = () => {
        const inv = getInventory();
        const eq = getEquipped();
        const equippedIds = new Set(Object.values(eq).filter(Boolean));

        let removedCount = 0;
        const newInv = inv.filter(entry => {
            if (equippedIds.has(entry.id)) return true; // garde équipés
            const item = getItemById(entry.itemId);
            if (!item) return true;
            const itemRarity = item.rarity || 'common';
            if (itemRarity === rarity) {
                removedCount++;
                return false;
            }
            return true;
        });

        saveInventory(newInv);

        if (typeof showToast === 'function') {
            showToast(`🗑️ ${removedCount} item(s) ${(r.label || rarity)} supprimé(s)`, 'info', 2500);
        }
        if (typeof vibrate === 'function') vibrate([40, 30, 60]);

        // Re-render le modal de nettoyage
        document.getElementById('inventoryCleanupModal')?.remove();
        openInventoryCleanupModal();

        // Re-render le modal d'équipement
        const rpgModal = document.getElementById('rpgEquipModal');
        if (rpgModal && typeof showRPGEquipmentModal === 'function') {
            const activeTab = rpgModal.dataset.currentTab || 'inventory';
            rpgModal.remove();
            showRPGEquipmentModal(activeTab);
        }

        if (typeof renderAdventureTab === 'function') renderAdventureTab();
    };

    if (typeof window.showConfirm === 'function') {
        window.showConfirm(
            `<strong style="color:${r.color}">${count} item(s)</strong> de rareté <strong style="color:${r.color}">${rarityLabel}</strong> seront supprimés définitivement. Cette action ne peut pas être annulée.`,
            doDiscard,
            null,
            {
                title: 'Supprimer en masse ?',
                subtitle: '◈ ACTION IRRÉVERSIBLE ◈',
                icon: '🗑️',
                confirmLabel: `🗑️ Supprimer ${count}`,
                cancelLabel: '↩ Annuler',
                danger: true
            }
        );
    } else {
        // Fallback
        if (confirm(`⚠️ Supprimer définitivement ${count} item(s) de rareté ${rarityLabel} ?\n\nCette action est irréversible.`)) {
            doDiscard();
        }
    }
}
window.confirmBulkDiscard = confirmBulkDiscard;



function showRPGEquipmentModal(defaultTab) {
    document.getElementById('rpgEquipModal')?.remove();

    let selectedInvId = null;
    let selectedItem  = null;

    // ─── Layout des slots autour du personnage ───────────────────────
    // L = gauche, R = droite (chaque côté = liste verticale)
    const _slotSvg = (p) => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const SLOT_LAYOUT_LEFT  = [
        { id:'head',      label:'TÊTE',     icon:'⛑️', svg:_slotSvg('<path d="M4 13a8 8 0 0 1 16 0"/><path d="M2 13h20"/><path d="M2 13v2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2"/><line x1="12" y1="5" x2="12" y2="2"/>') },
        { id:'weapon',    label:'ARME',     icon:'⚔️', svg:_slotSvg('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>') },
        { id:'hands',     label:'MAINS',    icon:'🥊', svg:_slotSvg('<path d="M7 11V7a2 2 0 0 1 4 0v3"/><path d="M11 9a2 2 0 0 1 4 0v1"/><path d="M15 10a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6h-2a5 5 0 0 1-3.6-1.5L4 15.5a1.8 1.8 0 0 1 2.5-2.5L8 14"/>') },
        { id:'legs',      label:'JAMBES',   icon:'🦵', svg:_slotSvg('<path d="M9 3v8l-1 10h3l1-7 1 7h3l-1-12V3"/>') },
        { id:'accessory', label:'ANNEAU',   icon:'💍', svg:_slotSvg('<circle cx="12" cy="14" r="6"/><path d="M9 8 8 3h8l-1 5"/>') },
    ];
    const SLOT_LAYOUT_RIGHT = [
        { id:'chest',     label:'TORSE',    icon:'🛡️', svg:_slotSvg('<path d="M12 3 5 6v6a9 9 0 0 0 7 8 9 9 0 0 0 7-8V6z"/>') },
        { id:'feet',      label:'PIEDS',    icon:'👟', svg:_slotSvg('<path d="M2 17h13l5-1c1-.2 2-1 2-2 0-1-1-1.5-2-2l-6-3-2-3H6l1 6-5 3z"/><path d="M2 17v2h20v-2"/>') },
    ];

    // ─── Génère un slot d'équipement ─────────────────────────────────
    function renderSlot(slot) {
        const eq = getEquipped();
        const eqItems = getEquippedItems();
        const item = eqItems[slot.id];
        const r = item ? getRarityInfo(item.rarity) : null;
        const isCursed = item && item.cursed;
        const bg = item ? (isCursed ? 'rgba(168,85,247,0.12)' : r.bg) : 'rgba(34,197,94,0.04)';
        const border = item ? (isCursed ? '#a855f7' : r.color) : 'rgba(34,197,94,0.35)';
        const glow = item ? (isCursed ? '' : `box-shadow:0 0 12px ${r.glow}, inset 0 0 8px ${r.glow};`) : '';

        return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
            <div style="font-size:0.55em;color:rgba(255,255,255,0.55);font-weight:700;letter-spacing:1.5px;">${slot.label}</div>
            <div onclick="window._rpgEqSelectSlot('${slot.id}')" class="${isCursed ? 'cursed-slot' : ''}" style="
                width:56px;height:56px;border-radius:10px;cursor:pointer;flex-shrink:0;
                background:${bg};border:2px solid ${border};${glow}
                display:flex;align-items:center;justify-content:center;
                position:relative;transition:transform 0.15s;">
                ${item
                    ? `<span style="font-size:1.6em;line-height:1;${isCursed ? 'filter:drop-shadow(0 0 6px rgba(168,85,247,0.9));' : ''}">${item.icon}</span>
                       <span style="position:absolute;top:1px;right:2px;font-size:0.42em;font-weight:900;color:${isCursed ? '#c084fc' : r.color};">${isCursed ? '☠' : r.label}</span>`
                    : `<span style="opacity:0.3;color:#4ade80;display:flex;">${slot.svg || `<span style="font-size:1.3em;">${slot.icon}</span>`}</span>`
                }
            </div>
        </div>`;
    }

    // ─── Génère le panneau personnage central (REFONTE V2 : avatar FULL WIDTH + slots overlay) ───
    function renderCharacterPanel() {
        const gender = localStorage.getItem('fitproAvatarGender') || 'homme';
        const path = gender === 'femme' ? 'images/avatars/avatar_femme.png' : 'images/avatars/avatar_homme.png';
        const toggleIcon = gender === 'femme' ? GENDER_SVG.homme : GENDER_SVG.femme;

        // Génère un slot positionné absolument sur l'avatar
        function renderFloatingSlot(slot, position) {
            const eqItems = getEquippedItems();
            const item = eqItems[slot.id];
            const r = item ? getRarityInfo(item.rarity) : null;
            const isCursed = item && item.cursed;
            const bg = item ? (isCursed ? 'rgba(168,85,247,0.14)' : r.bg) : 'rgba(10,14,24,0.7)';
            const border = item ? (isCursed ? '#a855f7' : r.color) : 'rgba(34,197,94,0.5)';
            const glow = item ? (isCursed ? '' : `box-shadow:0 0 14px ${r.glow},inset 0 0 8px ${r.glow};`) : 'box-shadow:0 0 12px rgba(34,197,94,0.25),0 2px 8px rgba(0,0,0,0.5);';

            // Récupérer le SVG depuis les définitions complètes (les objets inline n'ont pas le svg)
            const fullSlot = [...SLOT_LAYOUT_LEFT, ...SLOT_LAYOUT_RIGHT].find(s => s.id === slot.id);
            const slotSvg = (slot.svg) || (fullSlot && fullSlot.svg) || `<span style="font-size:1.3em;">${slot.icon || ''}</span>`;

            return `<div style="position:absolute;${position};z-index:5;display:flex;flex-direction:column;align-items:center;gap:3px;">
                <div onclick="window._rpgEqSelectSlot('${slot.id}')" class="${isCursed ? 'cursed-slot' : ''}" style="
                    width:54px;height:54px;border-radius:10px;cursor:pointer;
                    background:${bg};border:2px solid ${border};${glow}
                    display:flex;align-items:center;justify-content:center;
                    position:relative;transition:transform 0.15s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
                    ${item
                        ? `<span style="font-size:1.55em;line-height:1;filter:drop-shadow(0 0 4px rgba(0,0,0,0.8))${isCursed ? ' drop-shadow(0 0 6px rgba(168,85,247,0.9))' : ''};">${item.icon}</span>
                           <span style="position:absolute;top:1px;right:2px;font-size:0.42em;font-weight:900;color:${isCursed ? '#c084fc' : r.color};">${isCursed ? '☠' : r.label}</span>`
                        : `<span style="opacity:0.7;color:#4ade80;display:flex;filter:drop-shadow(0 0 4px rgba(0,0,0,0.8));">${slotSvg}</span>`
                    }
                </div>
                <div style="font-size:0.5em;color:rgba(255,255,255,0.85);font-weight:900;letter-spacing:1.5px;text-shadow:0 1px 3px rgba(0,0,0,0.95),0 0 6px rgba(0,0,0,0.8);background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:4px;border:1px solid ${isCursed ? 'rgba(168,85,247,0.5)' : 'rgba(74,222,128,0.3)'};">${slot.label}</div>
            </div>`;
        }

        return `
        <div style="position:relative;width:100%;aspect-ratio:1066/1476;max-height:700px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px;background:#000;">

            <!-- AVATAR FULL SIZE (prend toute la largeur) -->
            <img src="${path}"
                 alt="Avatar ${gender}"
                 style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:1;
                        filter:drop-shadow(0 0 24px rgba(34,197,94,0.3));"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />

            <!-- Fallback si image absente -->
            <div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:rgba(74,222,128,0.6);font-size:0.8em;text-align:center;">Avatar indisponible</div>

            <!-- Overlay subtil pour mieux voir les slots -->
            <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,0.45) 0%,transparent 18%,transparent 82%,rgba(0,0,0,0.45) 100%);pointer-events:none;z-index:2;"></div>

            <!-- Glow scan-lines -->
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0,transparent 4px,rgba(74,222,128,0.02) 4px,rgba(74,222,128,0.02) 5px);pointer-events:none;z-index:3;"></div>

            <!-- ═══ SLOTS ÉQUIPEMENT FLOTTANTS (par-dessus l'avatar) ═══ -->

            <!-- COLONNE GAUCHE -->
            ${renderFloatingSlot({id:'head',label:'TÊTE',icon:'⛑️'}, 'top:14px;left:10px')}
            ${renderFloatingSlot({id:'weapon',label:'ARME',icon:'⚔️'}, 'top:110px;left:10px')}
            ${renderFloatingSlot({id:'hands',label:'MAINS',icon:'🥊'}, 'top:206px;left:10px')}
            ${renderFloatingSlot({id:'legs',label:'JAMBES',icon:'🦵'}, 'top:302px;left:10px')}
            ${renderFloatingSlot({id:'accessory',label:'ANNEAU',icon:'💍'}, 'top:398px;left:10px')}

            <!-- COLONNE DROITE -->
            ${renderFloatingSlot({id:'chest',label:'TORSE',icon:'🛡️'}, 'top:14px;right:10px')}
            ${renderFloatingSlot({id:'feet',label:'PIEDS',icon:'👟'}, 'top:110px;right:10px')}

            <!-- Bouton toggle Homme/Femme (sous le slot PIEDS) -->
            <button onclick="window.toggleAvatarGender && window.toggleAvatarGender()"
                    title="Changer d'avatar"
                    style="position:absolute;top:206px;right:10px;z-index:5;
                           background:linear-gradient(135deg,rgba(34,197,94,0.3),rgba(168,85,247,0.25));
                           border:2px solid rgba(74,222,128,0.6);
                           color:#4ade80;width:54px;height:54px;border-radius:10px;
                           cursor:pointer;font-size:1.5em;
                           display:flex;align-items:center;justify-content:center;
                           box-shadow:0 0 14px rgba(34,197,94,0.4),0 2px 8px rgba(0,0,0,0.5);
                           backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">
                <span style="display:flex;width:30px;height:30px;">${toggleIcon.replace('width="17" height="17"', 'width="30" height="30"')}</span>
            </button>
            <div style="position:absolute;top:264px;right:10px;z-index:5;font-size:0.5em;color:rgba(255,255,255,0.85);font-weight:900;letter-spacing:1.5px;background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:4px;border:1px solid rgba(74,222,128,0.3);width:54px;text-align:center;box-sizing:border-box;text-shadow:0 1px 3px rgba(0,0,0,0.95);">SEXE</div>

            <!-- Coins HUD décoratifs -->
            <div style="position:absolute;top:0;left:0;width:24px;height:24px;border-top:2px solid #4ade80;border-left:2px solid #4ade80;border-top-left-radius:12px;box-shadow:0 0 10px rgba(74,222,128,0.5);pointer-events:none;z-index:4;"></div>
            <div style="position:absolute;top:0;right:0;width:24px;height:24px;border-top:2px solid #4ade80;border-right:2px solid #4ade80;border-top-right-radius:12px;box-shadow:0 0 10px rgba(74,222,128,0.5);pointer-events:none;z-index:4;"></div>
            <div style="position:absolute;bottom:0;left:0;width:24px;height:24px;border-bottom:2px solid #4ade80;border-left:2px solid #4ade80;border-bottom-left-radius:12px;box-shadow:0 0 10px rgba(74,222,128,0.5);pointer-events:none;z-index:4;"></div>
            <div style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-bottom:2px solid #4ade80;border-right:2px solid #4ade80;border-bottom-right-radius:12px;box-shadow:0 0 10px rgba(74,222,128,0.5);pointer-events:none;z-index:4;"></div>

            <!-- Glow line top/bottom -->
            <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#4ade80,transparent);z-index:4;pointer-events:none;"></div>
            <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#4ade80,transparent);z-index:4;pointer-events:none;"></div>
        </div>`;
    }

    // ─── Stat bar ────────────────────────────────────────────────────
    function statRow(label, val, color, icon) {
        const pct = Math.min(100, val);
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:0.7em;width:18px;">${icon}</span>
            <span style="font-size:0.62em;color:#94a3b8;font-weight:700;width:42px;letter-spacing:0.5px;">${label}</span>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.05);border-radius:99px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${color}88,${color});border-radius:99px;box-shadow:0 0 6px ${color};"></div>
            </div>
            <span style="font-size:0.72em;color:${color};font-weight:900;width:26px;text-align:right;">${val}</span>
        </div>`;
    }

    // ─── Panneau stats à droite ──────────────────────────────────────
    function renderStatsPanel() {
        const st = getPlayerEquipStats();
        const setBonuses = getSetBonuses();
        const baseSt = { STR:10, AGI:10, VIT:10, END:10, PER:5, SEN:5 };
        return `
            ${statRow('STR', baseSt.STR + (st.STR||0), '#ef4444', '⚔️')}
            ${statRow('AGI', baseSt.AGI + (st.AGI||0), '#f59e0b', '⚡')}
            ${statRow('VIT', baseSt.VIT + (st.VIT||0), '#3b82f6', '💙')}
            ${statRow('END', baseSt.END + (st.END||0), '#22c55e', '💚')}
            ${statRow('PER', baseSt.PER + (st.PER||0), '#06b6d4', '👁️')}
            ${statRow('SEN', baseSt.SEN + (st.SEN||0), '#a855f7', '🌀')}
            ${setBonuses.length > 0 ? `
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(34,197,94,0.15);">
                    ${setBonuses.map(sb => `
                        <div style="font-size:0.62em;color:#fbbf24;font-weight:700;margin-bottom:2px;">
                            ✦ ${sb.set.icon} ${sb.set.name} (${sb.count})
                        </div>
                        <div style="font-size:0.58em;color:#a78bfa;line-height:1.4;margin-bottom:4px;">${sb.bonus.desc}</div>
                    `).join('')}
                </div>` : ''}`;
    }

    // ─── Détails de l'objet sélectionné ──────────────────────────────
    function renderItemDetails() {
        if (!selectedItem) {
            return `<div style="font-size:0.72em;color:#475569;text-align:center;padding:20px 8px;line-height:1.6;">
                Sélectionne un slot d'équipement<br/>ou un item de l'inventaire<br/>pour voir les détails.
            </div>`;
        }
        const r = getRarityInfo(selectedItem.rarity);
        const block = getEquipBlockReason(selectedItem);
        return `
            <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
                <div style="font-size:1.8em;flex-shrink:0;filter:drop-shadow(0 0 6px ${r.glow});">${selectedItem.icon}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:0.78em;font-weight:800;color:white;line-height:1.2;">${selectedItem.name}</div>
                    <div style="font-size:0.58em;color:${r.color};font-weight:700;margin-top:2px;letter-spacing:1px;">${r.labelFull.toUpperCase()}</div>
                </div>
            </div>
            <div style="font-size:0.62em;color:#94a3b8;line-height:1.45;margin-bottom:8px;">${selectedItem.description}</div>
            ${selectedItem.passive ? `
                <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.18);border-radius:6px;padding:5px 8px;margin-bottom:6px;">
                    <div style="font-size:0.52em;color:#22c55e;font-weight:800;letter-spacing:1px;">⚡ PASSIF</div>
                    <div style="font-size:0.62em;color:#4ade80;line-height:1.35;">${selectedItem.passive}</div>
                </div>` : ''}
            ${selectedItem.ringEffect ? (() => {
                const isCmd = ['compFailReduce','compSpeed','compStamina','compAll'].includes(selectedItem.ringEffect.type);
                const ec = isCmd ? '#f5b942' : '#22d3ee';
                const ecLight = isCmd ? '#fcd34d' : '#67e8f9';
                const ecBg = isCmd ? 'rgba(245,185,66,0.10)' : 'rgba(34,211,238,0.08)';
                const ecBd = isCmd ? 'rgba(245,185,66,0.4)' : 'rgba(34,211,238,0.3)';
                const label = isCmd ? '👑 COMMANDEMENT' : '💍 EFFET D\'ANNEAU';
                return `<div style="background:${ecBg};border:1px solid ${ecBd};border-radius:6px;padding:5px 8px;margin-bottom:6px;">
                    <div style="font-size:0.52em;color:${ec};font-weight:800;letter-spacing:1px;">${label}</div>
                    <div style="font-size:0.64em;color:${ecLight};line-height:1.35;font-weight:700;">${selectedItem.ringEffect.label}</div>
                </div>`;
            })() : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;margin-bottom:8px;">
                ${Object.entries(selectedItem.stats||{}).filter(([_,v]) => v !== 0).map(([k,v]) => `
                    <div style="background:#0a0e18;border:1px solid ${v<0?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.04)'};border-radius:5px;padding:3px;text-align:center;">
                        <div style="font-size:0.5em;color:#475569;font-weight:700;">${k}</div>
                        <div style="font-size:0.7em;color:${v<0?'#f87171':r.color};font-weight:900;">${v<0?'':'+'}${v}</div>
                    </div>`).join('')}
            </div>
            ${selectedInvId ? `
                ${block ? `
                    <button disabled style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#f87171;font-size:0.66em;font-weight:700;">
                        ${block.reason === 'muscle_too_weak' ? '💪' : '🔒'} ${block.label}
                    </button>` : `
                    <button onclick="window._rpgEqEquipSelected()" style="width:100%;padding:8px;border-radius:8px;border:none;background:linear-gradient(135deg,${r.color},${r.color}cc);color:white;font-size:0.7em;font-weight:800;cursor:pointer;">
                        ✓ ÉQUIPER
                    </button>`}
            ` : ''}`;
    }

    // ─── Grille d'inventaire ─────────────────────────────────────────
    function renderInventoryGrid() {
        const inv = getInventory();
        const eq = getEquipped();
        const equippedIds = new Set(Object.values(eq).filter(Boolean));
        const itemsList = inv.map(entry => ({ entry, item: getItemById(entry.itemId) })).filter(x => x.item);

        const SLOT_COUNT = 35; // 5 colonnes × 7 lignes
        const emptySlots = Math.max(0, SLOT_COUNT - itemsList.length);

        return `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:6px;">
            ${itemsList.map(({entry, item}) => {
                const isEq = equippedIds.has(entry.id);
                const r2 = getRarityInfo(item.rarity);
                const block = !isEq ? getEquipBlockReason(item) : null;
                const locked = !!block;
                const selected = selectedInvId === entry.id;
                return `<div onclick="window._rpgEqInvSelect('${item.id}',${entry.id})" style="
                    aspect-ratio:1;border-radius:6px;cursor:pointer;
                    background:${selected ? r2.color+'22' : locked ? 'rgba(0,0,0,0.4)' : r2.bg};
                    border:${selected ? 2 : 1.5}px solid ${selected ? r2.color : isEq ? r2.color : locked ? 'rgba(255,255,255,0.05)' : r2.color+'40'};
                    box-shadow:${isEq ? `0 0 8px ${r2.glow}` : selected ? `0 0 12px ${r2.glow}` : 'none'};
                    display:flex;align-items:center;justify-content:center;position:relative;
                    opacity:${locked && !selected ? 0.5 : 1};">
                    ${isEq ? `<div style="position:absolute;top:1px;right:2px;font-size:0.38em;color:${r2.color};font-weight:900;">●</div>` : ''}
                    ${locked ? `<div style="position:absolute;top:0px;left:1px;font-size:0.5em;">${block.reason==='muscle_too_weak'?'💪':'🔒'}</div>` : ''}
                    <span style="font-size:1.4em;${locked?'filter:grayscale(0.6);':''}">${item.icon}</span>
                </div>`;
            }).join('')}
            ${Array.from({length:emptySlots}, () => `
                <div style="aspect-ratio:1;border-radius:6px;background:rgba(34,197,94,0.025);border:1px dashed rgba(34,197,94,0.15);"></div>
            `).join('')}
        </div>`;
    }

    function rebuild() {
        const m = document.getElementById('rpgEqContent');
        if (!m) return;
        m.innerHTML = renderFullLayout();
    }

    function renderFullLayout() {
        // ─── Header sci-fi avec coins style "frame" ──────────────────
        return `
        <!-- Header avec corners -->
        <div style="position:relative;padding:18px 18px 14px;border-bottom:1px solid rgba(34,197,94,0.15);">
            <!-- Coins décoratifs -->
            <div style="position:absolute;top:6px;left:6px;width:18px;height:18px;border-top:2px solid #22c55e;border-left:2px solid #22c55e;"></div>
            <div style="position:absolute;top:6px;right:6px;width:18px;height:18px;border-top:2px solid #22c55e;border-right:2px solid #22c55e;"></div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div>
                    <div style="font-size:1.15em;font-weight:900;color:white;letter-spacing:1.5px;line-height:1;">
                        INVENTAIRE <span style="color:#22c55e;">D'ÉQUIPEMENT</span>
                    </div>
                    <div style="font-size:0.55em;color:#475569;letter-spacing:2px;margin-top:4px;font-weight:700;">◈ MENU D'ÉQUIPEMENT</div>
                </div>
                <button onclick="document.getElementById('rpgEquipModal').remove()" style="
                    width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,0.08);
                    border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:0.95em;font-weight:900;
                    cursor:pointer;flex-shrink:0;">✕</button>
            </div>
        </div>

        <!-- Body scrollable -->
        <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:14px;">

            <!-- ━━━ PERSONNAGE ━━━ -->
            <div style="background:#000;
                       border:1px solid rgba(34,197,94,0.3);border-radius:14px;position:relative;
                       padding:0;margin-bottom:14px;overflow:hidden;">
                <div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-size:0.5em;color:#4ade80;font-weight:900;letter-spacing:3px;z-index:10;text-shadow:0 0 8px rgba(74,222,128,0.6),0 1px 4px rgba(0,0,0,0.9);background:rgba(0,0,0,0.6);padding:3px 10px;border-radius:4px;border:1px solid rgba(74,222,128,0.3);">◈ PERSONNAGE ◈</div>
                ${renderCharacterPanel()}
            </div>

            <!-- ━━━ STATISTIQUES ━━━ -->
            <div style="background:linear-gradient(160deg,rgba(34,197,94,0.04),transparent);
                       border:1px solid rgba(34,197,94,0.18);border-radius:14px;position:relative;
                       padding:14px 14px 10px;margin-bottom:14px;">
                <div style="position:absolute;top:6px;left:10px;font-size:0.5em;color:#22c55e;font-weight:800;letter-spacing:2px;">◈ STATISTIQUES ET EFFETS</div>
                <div style="margin-top:10px;">
                    ${renderStatsPanel()}
                </div>
            </div>

            <!-- ━━━ INVENTAIRE ━━━ -->
            <div style="background:linear-gradient(160deg,rgba(34,197,94,0.04),transparent);
                       border:1px solid rgba(34,197,94,0.18);border-radius:14px;position:relative;
                       padding:18px 6px 10px;margin-bottom:14px;">
                <div style="position:absolute;top:6px;left:10px;font-size:0.5em;color:#22c55e;font-weight:800;letter-spacing:2px;">◈ INVENTAIRE</div>
                <button onclick="openInventoryCleanupModal()" style="position:absolute;top:4px;right:6px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);color:#f87171;border-radius:6px;padding:3px 9px;font-size:0.55em;font-weight:900;letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;display:flex;align-items:center;gap:4px;">
                    🗑️ Nettoyer
                </button>
                ${renderInventoryGrid()}
            </div>

        </div>`;
    }

    // ─── Handlers globaux ────────────────────────────────────────────
    window._rpgEqSelectSlot = function(slotId) {
        const eqItems = getEquippedItems();
        const item = eqItems[slotId];
        if (item) {
            // 🎯 Ouvre une popup au-dessus du modal d'équipement
            showItemPopup(item, null, slotId);
        }
    };

    window._rpgEqInvSelect = function(itemId, invId) {
        const item = getItemById(itemId);
        if (!item) return;
        // 🎯 Ouvre une popup au-dessus du modal d'équipement
        showItemPopup(item, invId, null);
    };

    window._rpgEqEquipSelected = function() {
        if (!selectedInvId) return;
        if (typeof window.tryEquipWithFeedback === 'function') {
            window.tryEquipWithFeedback(selectedInvId, function() {
                selectedItem = null;
                selectedInvId = null;
                rebuild();
            });
        } else {
            const result = equipItem(selectedInvId);
            if (result && result.success) {
                selectedItem = null;
                selectedInvId = null;
                rebuild();
            }
        }
    };

    window._rpgRefreshEquipView = rebuild;

    // ─── Construire le modal ─────────────────────────────────────────
    const modal = document.createElement('div');
    modal.id = 'rpgEquipModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;padding:0;';

    modal.innerHTML = `
        <div id="rpgEqContent" style="
            width:100%;max-width:520px;height:100%;max-height:100vh;
            background:linear-gradient(160deg,#040a0a 0%,#020608 50%,#040a06 100%);
            display:flex;flex-direction:column;overflow:hidden;
            border:1px solid rgba(34,197,94,0.2);position:relative;">
            ${renderFullLayout()}
        </div>`;

    // Fond grille subtil
    const gridBg = document.createElement('div');
    gridBg.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0.08;background-image:linear-gradient(rgba(34,197,94,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.3) 1px,transparent 1px);background-size:24px 24px;';
    modal.querySelector('#rpgEqContent').appendChild(gridBg);

    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
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
window.canEquipItem          = canEquipItem;
window.getHunterRankIndex    = getHunterRankIndex;
window.getItemRankValue      = getItemRankValue;
window.getRequiredRankLabel  = getRequiredRankLabel;

// Handler global avec feedback visuel — à utiliser partout à la place de equipItem()
window.tryEquipWithFeedback = function(invId, onSuccess) {
    const result = equipItem(invId);
    if (result.success) {
        if (typeof onSuccess === 'function') onSuccess();
        if (typeof renderAdventureTab === 'function') renderAdventureTab();
        if (typeof window._rpgRefreshEquipView === 'function') window._rpgRefreshEquipView();
    } else if (result.reason === 'rank_too_low' || result.reason === 'muscle_too_weak') {
        const isMuscle = result.reason === 'muscle_too_weak';
        document.getElementById('rankBlockModal')?.remove();
        const m = document.createElement('div');
        m.id = 'rankBlockModal';
        m.style.cssText = 'position:fixed;inset:0;z-index:10200;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:20px;';
        m.innerHTML = `<div style="width:100%;max-width:300px;background:#0d0d0d;border-radius:20px;padding:24px 20px;text-align:center;border:2px solid rgba(239,68,68,0.5);box-shadow:0 0 40px rgba(239,68,68,0.12);animation:dropPop 0.3s ease;">
            <div style="font-size:2.5em;margin-bottom:10px;">${isMuscle ? '💪' : '🔒'}</div>
            <div style="font-size:0.58em;color:rgba(239,68,68,0.7);font-weight:800;text-transform:uppercase;letter-spacing:3px;margin-bottom:8px;">
                ${isMuscle ? 'Muscle trop faible' : 'Rang insuffisant'}
            </div>
            <div style="font-size:0.95em;font-weight:800;color:white;margin-bottom:10px;">${result.itemName || ''}</div>
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px 14px;margin-bottom:14px;">
                <div style="font-size:0.78em;font-weight:700;color:#f87171;margin-bottom:4px;">⛔ ${result.label}</div>
                <div style="font-size:0.7em;color:#475569;line-height:1.6;">${result.detail}</div>
            </div>
            <div style="font-size:0.7em;color:#334155;margin-bottom:14px;line-height:1.55;">
                ${isMuscle
                    ? 'Entraîne ce groupe musculaire pour augmenter son niveau et déverrouiller cet équipement.'
                    : 'Continue de t\'entraîner pour augmenter ton rang de chasseur et débloquer cet équipement.'}
            </div>
            <button onclick="document.getElementById('rankBlockModal').remove()" style="width:100%;padding:11px;border-radius:12px;border:none;background:rgba(239,68,68,0.15);color:#f87171;font-weight:700;cursor:pointer;font-size:0.85em;">Compris</button>
        </div>`;
        m.addEventListener('click', e => { if (e.target === m) m.remove(); });
        document.body.appendChild(m);
    }
};
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
