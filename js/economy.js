// ═══════════════════════════════════════════════════════════════════════
// 💰 ÉCONOMIE — Or, Minéraux et Marchand (Awakened)
// ─────────────────────────────────────────────────────────────────────
// • Les MINÉRAUX tombent en fermant une Faille (selon rang + performance).
// • Le joueur VEND ses minéraux au marchand contre de l'OR.
// • Avec l'OR : achat de consommables et d'équipement (rang ≈ celui du joueur).
// • Le stock d'équipement du marchand TOURNE chaque semaine.
// ═══════════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    // ─── Clés de stockage (par profil) ───────────────────────────────
    function _profileSuffix() {
        try { return (typeof getCurrentProfileId === 'function' && getCurrentProfileId()) ? '_' + getCurrentProfileId() : ''; }
        catch(e) { return ''; }
    }
    const GOLD_KEY     = 'awakGold';
    const MINERALS_KEY = 'awakMinerals';

    // ─── OR ──────────────────────────────────────────────────────────
    function getGold() {
        try { return parseInt(localStorage.getItem(GOLD_KEY + _profileSuffix()) || '0') || 0; }
        catch(e) { return 0; }
    }
    function setGold(v) {
        try { localStorage.setItem(GOLD_KEY + _profileSuffix(), String(Math.max(0, Math.round(v)))); } catch(e) {}
    }
    function addGold(n) { setGold(getGold() + n); return getGold(); }
    function spendGold(n) {
        if (getGold() < n) return false;
        setGold(getGold() - n);
        return true;
    }

    // ─── MINÉRAUX ────────────────────────────────────────────────────
    // Types de minéraux par rareté, avec valeur de revente en or.
    const MINERAL_TYPES = {
        quartz:    { id:'quartz',    name:'Quartz',           icon:'⚪', value:1,    color:'#cbd5e1' },
        amethyst:  { id:'amethyst',  name:'Améthyste',        icon:'🟣', value:2,    color:'#a855f7' },
        emerald:   { id:'emerald',   name:'Émeraude',         icon:'🟢', value:6,    color:'#22c55e' },
        sapphire:  { id:'sapphire',  name:'Saphir',           icon:'🔵', value:13,   color:'#3b82f6' },
        ruby:      { id:'ruby',      name:'Rubis',            icon:'🔴', value:26,   color:'#ef4444' },
        diamond:   { id:'diamond',   name:'Diamant',          icon:'💎', value:57,   color:'#67e8f9' },
        ethercore: { id:'ethercore', name:'Cœur d\u2019Éther', icon:'🌟', value:130,  color:'#fbbf24' },
    };

    // Quels minéraux peut donner une Faille selon son rang.
    const MINERALS_BY_RANK = {
        E:   ['quartz'],
        D:   ['quartz', 'amethyst'],
        C:   ['amethyst', 'emerald'],
        B:   ['emerald', 'sapphire'],
        A:   ['sapphire', 'ruby'],
        S:   ['ruby', 'diamond'],
        SS:  ['diamond', 'ethercore'],
        SSS: ['diamond', 'ethercore'],
    };

    // Inventaire de minéraux : { quartz: 3, ruby: 1, ... }
    function getMinerals() {
        try { return JSON.parse(localStorage.getItem(MINERALS_KEY + _profileSuffix()) || '{}') || {}; }
        catch(e) { return {}; }
    }
    function saveMinerals(m) {
        try { localStorage.setItem(MINERALS_KEY + _profileSuffix(), JSON.stringify(m)); } catch(e) {}
    }
    function addMineral(typeId, qty) {
        const m = getMinerals();
        m[typeId] = (m[typeId] || 0) + (qty || 1);
        saveMinerals(m);
    }
    function getMineralCount(typeId) { return getMinerals()[typeId] || 0; }

    // Valeur totale de tous les minéraux possédés (en or).
    function getMineralsTotalValue() {
        const m = getMinerals();
        let total = 0;
        for (const id in m) {
            if (MINERAL_TYPES[id]) total += MINERAL_TYPES[id].value * m[id];
        }
        return total;
    }

    // Vendre TOUS les minéraux → or.
    function sellAllMinerals() {
        const value = getMineralsTotalValue();
        if (value <= 0) return 0;
        addGold(value);
        saveMinerals({});
        return value;
    }

    // Vendre un type de minéral précis.
    function sellMineral(typeId, qty) {
        const have = getMineralCount(typeId);
        const n = Math.min(qty || have, have);
        if (n <= 0 || !MINERAL_TYPES[typeId]) return 0;
        const m = getMinerals();
        m[typeId] = have - n;
        if (m[typeId] <= 0) delete m[typeId];
        saveMinerals(m);
        const gold = MINERAL_TYPES[typeId].value * n;
        addGold(gold);
        return gold;
    }

    // ─── DROP DE MINÉRAUX après une Faille ───────────────────────────
    // Basé sur les SÉRIES complétées (effort réel, pas de farm passif au temps).
    // Plafonné pour éviter l'abus. Le bonus "prospecteur" (items + compétence)
    // augmente la quantité trouvée.
    const MINERALS_MAX_PER_RIFT = 50; // plafond dur de minéraux par Faille

    function dropMineralsForRift(rank, grade, setsCompleted, mineralMult) {
        try {
            const pool = MINERALS_BY_RANK[rank] || MINERALS_BY_RANK.E;
            const sets = Math.max(0, setsCompleted || 0);
            if (sets <= 0) return []; // aucune série = aucun effort = aucun minéral
            const mult = mineralMult || 1; // multiplicateur "Filon" (1 = Faille normale)

            // Base : ~4 minéraux par série complétée (3 séries → 12, 10 séries → 40).
            let baseQty = sets * 4;
            // Bonus de performance (grade) : +2 à +8 minéraux pour les bonnes notes.
            const gradeBonus = { SSS:8, SS:6, S:5, A:4, B:2, C:1, D:0, F:0 };
            baseQty += (gradeBonus[grade] || 0);
            baseQty = Math.max(1, baseQty);

            // 💎 BONUS PROSPECTEUR (items + compétence) : multiplie la quantité trouvée.
            const prospect = getProspectorBonus(); // ex. 0.25 = +25%
            let totalQty = Math.round(baseQty * (1 + prospect) * mult);

            // Plafond : relevé proportionnellement pour les Failles "Filon" (sinon le bonus serait perdu)
            const cap = Math.round(MINERALS_MAX_PER_RIFT * mult);
            totalQty = Math.min(cap, Math.max(1, totalQty));

            // Répartir la quantité sur 1 à 2 types de minéraux du rang
            const drops = [];
            const typesCount = (totalQty >= 6 && pool.length > 1) ? 2 : 1;
            let remaining = totalQty;
            for (let i = 0; i < typesCount; i++) {
                const type = pool[Math.floor(Math.random() * pool.length)];
                const qty = (i === typesCount - 1) ? remaining : Math.ceil(remaining / 2);
                remaining -= qty;
                if (qty > 0) {
                    addMineral(type, qty);
                    const existing = drops.find(d => d.type === type);
                    if (existing) existing.qty += qty;
                    else drops.push({ type, qty });
                }
            }
            return drops;
        } catch(e) { return []; }
    }

    // 💎 Bonus prospecteur total (items équipés + compétence). Renvoie un ratio (0.25 = +25%).
    function getProspectorBonus() {
        let bonus = 0;
        try {
            if (typeof getEquippedItems === 'function' && typeof EQUIPMENT_DATABASE !== 'undefined') {
                const eq = getEquippedItems();
                (eq || []).forEach(it => {
                    if (it && typeof it.mineralBonus === 'number') bonus += it.mineralBonus;
                });
            }
            if (typeof window.awakGetProspectorSkillBonus === 'function') {
                bonus += window.awakGetProspectorSkillBonus() || 0;
            }
        } catch(e) {}
        return bonus;
    }

    // 💎 Minéraux rapportés par une MISSION de compagnons réussie.
    // Basé sur le rang de la Faille (pas de séries : ce sont les compagnons qui travaillent).
    // Volontairement MOINS rentable que de faire la Faille soi-même : la délégation a un coût
    // d'opportunité (compagnons indisponibles) et un risque d'échec.
    function dropMineralsForCompanionMission(rank) {
        try {
            const pool = MINERALS_BY_RANK[rank] || MINERALS_BY_RANK.E;
            // Base modeste selon le rang (les compagnons rapportent moins qu'une Faille jouée)
            const rankBase = { E:6, D:6, C:8, B:10, A:10, S:14, SS:14, SSS:14 };
            let qty = rankBase[rank] || 6;
            // Le bonus prospecteur s'applique aussi (le joueur a formé ses compagnons)
            qty = Math.round(qty * (1 + getProspectorBonus()));
            // Plafond plus bas que les Failles jouées (max 25 vs 50) — déléguer rapporte moins
            qty = Math.min(25, Math.max(1, qty));
            const type = pool[Math.floor(Math.random() * pool.length)];
            addMineral(type, qty);
            return { type, qty };
        } catch(e) { return null; }
    }

    // ─── Exposition globale ──────────────────────────────────────────
    window.AwakEconomy = {
        MINERAL_TYPES,
        MINERALS_BY_RANK,
        getGold, addGold, spendGold, setGold,
        getMinerals, getMineralCount, addMineral,
        getMineralsTotalValue, sellAllMinerals, sellMineral,
        dropMineralsForRift,
        // boutique (ajouté plus bas)
        getConsumableShop, buyConsumable,
        getEquipmentShop, buyEquipment, refreshEquipmentShopIfNeeded,
        getWeekKey,
    };

    // ═══════════════════════════════════════════════════════════════
    // 🛒 BOUTIQUE DU MARCHAND
    // ═══════════════════════════════════════════════════════════════

    // ─── Consommables vendus (prix en or) ────────────────────────────
    // Réutilise les CONSUMABLES définis dans app.js (mêmes ids).
    const CONSUMABLE_PRICES = {
        elixir_force:   120,   // +25% STR la prochaine Faille
        pierre_volonte: 100,   // -15% HP boss
        fragment_temps: 150,   // +crit
        larme_systeme:  300,   // revive
    };

    function getConsumableShop() {
        const out = [];
        try {
            const list = (typeof window.CONSUMABLES_PUBLIC !== 'undefined') ? window.CONSUMABLES_PUBLIC
                       : (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []);
            (list || []).forEach(c => {
                const price = CONSUMABLE_PRICES[c.id];
                if (price) out.push({ id:c.id, name:c.name, icon:c.icon, description:c.description, price });
            });
        } catch(e) {}
        return out;
    }

    function buyConsumable(itemId) {
        const price = CONSUMABLE_PRICES[itemId];
        if (!price) return { ok:false, reason:'Objet indisponible' };
        if (getGold() < price) return { ok:false, reason:'Or insuffisant' };
        if (typeof window.awakConsumablesAdd !== 'function') return { ok:false, reason:'Erreur système' };
        spendGold(price);
        window.awakConsumablesAdd(itemId, 1);
        return { ok:true, price };
    }

    // ─── Équipement vendu (stock hebdomadaire, calibré sur le rang) ───
    const EQUIP_SHOP_KEY = 'awakEquipShop';

    // Identifiant de semaine (année + n° de semaine ISO) → change chaque lundi.
    function getWeekKey() {
        const d = new Date();
        const target = new Date(d.valueOf());
        const dayNr = (d.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = new Date(target.getFullYear(), 0, 4);
        const weekNo = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
        return target.getFullYear() + '-W' + weekNo;
    }

    // Raretés vendues selon le rang du joueur (autour de son niveau).
    const SHOP_RARITY_BY_RANK = {
        E:   ['common', 'uncommon'],
        D:   ['common', 'uncommon', 'rare'],
        C:   ['uncommon', 'rare', 'superior'],
        B:   ['rare', 'superior', 'epic'],
        A:   ['superior', 'epic', 'legendary'],
        S:   ['epic', 'legendary'],
        SS:  ['legendary', 'mythic'],
        SSS: ['legendary', 'mythic'],
    };

    // Prix d'un équipement selon sa rareté.
    const PRICE_BY_RARITY = {
        common:80, uncommon:180, rare:380, superior:650, epic:1100, legendary:2200, mythic:5000,
    };

    function _currentRankId() {
        try { return (typeof awakGetRank === 'function') ? awakGetRank().id : 'E'; }
        catch(e) { return 'E'; }
    }

    // 📈 Coefficient de prix selon le rang du joueur : les hauts rangs gagnent beaucoup
    // plus d'or (valeur des minéraux), donc leurs achats coûtent proportionnellement plus.
    // Garde un pouvoir d'achat RELATIF constant → l'or garde sa valeur à tous les rangs.
    const PRICE_COEF_BY_RANK = { E:1, D:1, C:2, B:4, A:8, S:15, SS:25, SSS:25 };
    function _priceCoef() {
        return PRICE_COEF_BY_RANK[_currentRankId()] || 1;
    }

    // Génère le stock d'équipement de la semaine (4 pièces) selon le rang.
    function _generateEquipmentShop(rankId) {
        const rarities = SHOP_RARITY_BY_RANK[rankId] || SHOP_RARITY_BY_RANK.E;
        const db = (typeof EQUIPMENT_DATABASE !== 'undefined') ? EQUIPMENT_DATABASE : [];
        // Pool : équipement (pas consommable) des raretés ciblées, hors items exclusifs Faille
        // (le marchand vend du stock "civil", l'exclusif Faille reste un butin de combat).
        const pool = db.filter(i => i.slot && i.slot !== 'consumable' && !i.riftOnly && rarities.includes(i.rarity));
        const fallback = db.filter(i => i.slot && i.slot !== 'consumable' && rarities.includes(i.rarity));
        const usable = pool.length >= 4 ? pool : fallback;
        // Tirer 4 pièces distinctes
        const picks = [];
        const copy = usable.slice();
        const coef = _priceCoef();
        for (let i = 0; i < 4 && copy.length; i++) {
            const idx = Math.floor(Math.random() * copy.length);
            const item = copy.splice(idx, 1)[0];
            picks.push({ id:item.id, price: Math.round((PRICE_BY_RARITY[item.rarity] || 200) * coef) });
        }
        return { week: getWeekKey(), rank: rankId, items: picks, purchased: [] };
    }

    // Récupère le stock courant, le régénère si la semaine a changé ou si le rang a augmenté.
    function refreshEquipmentShopIfNeeded() {
        let shop = null;
        try { shop = JSON.parse(localStorage.getItem(EQUIP_SHOP_KEY + _profileSuffix()) || 'null'); } catch(e) {}
        const week = getWeekKey();
        const rank = _currentRankId();
        if (!shop || shop.week !== week) {
            shop = _generateEquipmentShop(rank);
            try { localStorage.setItem(EQUIP_SHOP_KEY + _profileSuffix(), JSON.stringify(shop)); } catch(e) {}
        }
        return shop;
    }

    function getEquipmentShop() { return refreshEquipmentShopIfNeeded(); }

    function buyEquipment(itemId) {
        const shop = refreshEquipmentShopIfNeeded();
        const entry = shop.items.find(it => it.id === itemId);
        if (!entry) return { ok:false, reason:'Indisponible' };
        if (shop.purchased.includes(itemId)) return { ok:false, reason:'Déjà acheté cette semaine' };
        if (getGold() < entry.price) return { ok:false, reason:'Or insuffisant' };
        if (typeof getInventory !== 'function' || typeof saveInventory !== 'function') return { ok:false, reason:'Erreur système' };
        spendGold(entry.price);
        const inv = getInventory();
        inv.unshift({ itemId: itemId, obtainedAt: new Date().toISOString(), id: Date.now() });
        saveInventory(inv);
        shop.purchased.push(itemId);
        try { localStorage.setItem(EQUIP_SHOP_KEY + _profileSuffix(), JSON.stringify(shop)); } catch(e) {}
        return { ok:true, price: entry.price };
    }

    // ═══════════════════════════════════════════════════════════════
    // 🥋 MAÎTRISES DE COMBAT — achetables, augmentent les dégâts en Faille
    // selon le TYPE d'effort de l'exercice utilisé. On achète de la PUISSANCE :
    // ne rien acheter = rester moins fort (l'incitation va dans le bon sens).
    // ═══════════════════════════════════════════════════════════════
    const MASTERIES_KEY = 'awakMasteries';

    // Chaque maîtrise a 5 niveaux ; chaque niveau ajoute +6% de dégâts (jusqu'à +30%).
    const MASTERY_DEFS = {
        force:    { id:'force',    name:'Maîtrise de la Force',      icon:'💪', effort:'force',    color:'#ef4444', desc:'Augmente les dégâts des exercices de force (squats, développés, tirages…).' },
        cardio:   { id:'cardio',   name:'Maîtrise du Cardio',        icon:'🏃', effort:'cardio',   color:'#22c55e', desc:'Augmente les dégâts des exercices cardio et d\u2019endurance.' },
        explosif: { id:'explosif', name:'Maîtrise de l\u2019Explosivité', icon:'⚡', effort:'explosif', color:'#fbbf24', desc:'Augmente les dégâts des mouvements explosifs (sauts, sprints, burpees…).' },
    };
    const MASTERY_MAX_LEVEL = 5;
    const MASTERY_BONUS_PER_LEVEL = 0.06; // +6% par niveau → +30% au niveau max

    // Prix croissant par niveau (niveau 1 → 5).
    const MASTERY_PRICES = [200, 450, 800, 1300, 2000];

    function getMasteries() {
        try { return JSON.parse(localStorage.getItem(MASTERIES_KEY + _profileSuffix()) || '{}') || {}; }
        catch(e) { return {}; }
    }
    function saveMasteries(m) {
        try { localStorage.setItem(MASTERIES_KEY + _profileSuffix(), JSON.stringify(m)); } catch(e) {}
    }
    function getMasteryLevel(id) { return getMasteries()[id] || 0; }

    // Prix du PROCHAIN niveau d'une maîtrise (null si max atteint), ajusté au rang du joueur.
    function getMasteryNextPrice(id) {
        const lvl = getMasteryLevel(id);
        if (lvl >= MASTERY_MAX_LEVEL) return null;
        return Math.round(MASTERY_PRICES[lvl] * _priceCoef());
    }

    function buyMasteryLevel(id) {
        if (!MASTERY_DEFS[id]) return { ok:false, reason:'Maîtrise inconnue' };
        const lvl = getMasteryLevel(id);
        if (lvl >= MASTERY_MAX_LEVEL) return { ok:false, reason:'Niveau maximum atteint' };
        const price = Math.round(MASTERY_PRICES[lvl] * _priceCoef());
        if (getGold() < price) return { ok:false, reason:'Or insuffisant' };
        spendGold(price);
        const m = getMasteries();
        m[id] = lvl + 1;
        saveMasteries(m);
        return { ok:true, newLevel: lvl + 1, price };
    }

    // Multiplicateur de dégâts pour un type d'effort donné (1 + bonus).
    // Appelé depuis le calcul de dégâts en combat.
    function getMasteryDamageMult(effortType) {
        try {
            for (const id in MASTERY_DEFS) {
                if (MASTERY_DEFS[id].effort === effortType) {
                    return 1 + getMasteryLevel(id) * MASTERY_BONUS_PER_LEVEL;
                }
            }
        } catch(e) {}
        return 1;
    }

    window.AwakEconomy.getMasteries = getMasteries;
    window.AwakEconomy.dropMineralsForCompanionMission = dropMineralsForCompanionMission;
    window.AwakEconomy.getMasteryLevel = getMasteryLevel;
    window.AwakEconomy.getMasteryNextPrice = getMasteryNextPrice;
    window.AwakEconomy.buyMasteryLevel = buyMasteryLevel;
    window.AwakEconomy.getMasteryDamageMult = getMasteryDamageMult;
    window.AwakEconomy.MASTERY_DEFS = MASTERY_DEFS;
    window.AwakEconomy.MASTERY_MAX_LEVEL = MASTERY_MAX_LEVEL;
    window.AwakEconomy.MASTERY_BONUS_PER_LEVEL = MASTERY_BONUS_PER_LEVEL;
})();
