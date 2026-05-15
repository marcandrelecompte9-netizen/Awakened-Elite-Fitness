// ═══════════════════════════════════════════════════════════════════════
// FitPro Elite — Système de Défis (Style Solo Leveling)
// "Le Système" impose des défis. Échec = conséquences.
// ═══════════════════════════════════════════════════════════════════════

const CHALLENGE_STORAGE = {
    active:    'fitpro_active_challenge',
    history:   'fitpro_challenge_history',
    penalties: 'fitpro_active_penalties',
};

// ── TYPES DE DÉFIS ──────────────────────────────────────────────────────
// target: valeur cible, unit: unité affichée, icon: emoji
const CHALLENGE_TYPES = [
    {
        id: 'sessions',
        label: (t) => `Complète ${t} séance${t > 1 ? 's' : ''} d'entraînement`,
        icon: '💪',
        units: 'séances',
        targets: [1, 2, 3],
        check: (challenge) => {
            const history = _getChallengeHistory();
            const since = new Date(challenge.issuedAt);
            return history.filter(h => new Date(h.date) >= since).length;
        },
    },
    {
        id: 'minutes',
        label: (t) => `Accumule ${t} minutes d'entraînement`,
        icon: '⏱️',
        units: 'min',
        targets: [30, 60, 90, 120],
        check: (challenge) => {
            const history = _getChallengeHistory();
            const since = new Date(challenge.issuedAt);
            return history
                .filter(h => new Date(h.date) >= since)
                .reduce((s, h) => s + (Number(h.duration) || 0), 0);
        },
    },
    {
        id: 'muscle',
        label: (t, muscle) => `Entraîne ${muscle} ${t} fois`,
        icon: '🎯',
        units: 'fois',
        targets: [1, 2],
        check: (challenge) => {
            const history = _getChallengeHistory();
            const since = new Date(challenge.issuedAt);
            return history
                .filter(h => {
                    if (new Date(h.date) < since) return false;
                    const muscles = h.musclesWorked || h.muscles || [];
                    return Array.isArray(muscles) && muscles.includes(challenge.muscle);
                }).length;
        },
    },
    {
        id: 'streak',
        label: (t) => `Maintiens un streak de ${t} jours consécutifs`,
        icon: '🔥',
        units: 'jours',
        targets: [2, 3, 5, 7],
        check: () => {
            try {
                const stats = JSON.parse(localStorage.getItem('workoutStats') || '{}');
                return stats.streak || 0;
            } catch(e) { return 0; }
        },
    },
];

// ── CONSÉQUENCES D'ÉCHEC ────────────────────────────────────────────────
const PENALTIES = [
    {
        id: 'stat_drain',
        name: 'Drain de Statistiques',
        icon: '📉',
        desc: 'Toutes tes stats d\'équipement sont réduites de 20% pendant 24h.',
        duration: 24 * 60 * 60 * 1000,
        apply: () => ({ type: 'stat_drain', multiplier: 0.80, expiresAt: Date.now() + 24*60*60*1000 }),
    },
    {
        id: 'xp_curse',
        name: 'Malédiction d\'XP',
        icon: '💀',
        desc: 'Tu gagnes 50% moins d\'XP RPG pendant 48h.',
        duration: 48 * 60 * 60 * 1000,
        apply: () => ({ type: 'xp_curse', multiplier: 0.50, expiresAt: Date.now() + 48*60*60*1000 }),
    },
    {
        id: 'drop_ban',
        name: 'Malédiction de Butin',
        icon: '🚫',
        desc: 'Aucun équipement ne peut dropper pendant 24h.',
        duration: 24 * 60 * 60 * 1000,
        apply: () => ({ type: 'drop_ban', expiresAt: Date.now() + 24*60*60*1000 }),
    },
    {
        id: 'double_penalty',
        name: 'Double Punition',
        icon: '⛓️',
        desc: 'Stats -30% ET aucun drop pendant 48h. Le Système n\'est pas clément.',
        duration: 48 * 60 * 60 * 1000,
        apply: () => ({
            type: 'double_penalty',
            stat_multiplier: 0.70,
            drop_banned: true,
            expiresAt: Date.now() + 48*60*60*1000
        }),
    },
];

// ── MESSAGES DU SYSTÈME ─────────────────────────────────────────────────
const SYSTEM_ISSUE_MESSAGES = [
    'Un nouveau défi a été assigné par le Système.',
    'Le Système t\'observe. Prouve ta valeur.',
    'Mission reçue. L\'échec n\'est pas une option.',
    'Le Système a évalué tes capacités. Dépasse-les.',
    'Avertissement du Système : défi obligatoire activé.',
    'Tu as été choisi. Accomplis ce qui t\'est demandé.',
];

const SYSTEM_FAIL_MESSAGES = [
    'Vous avez échoué à remplir les conditions du défi. La punition sera appliquée.',
    'Le Système ne connaît pas l\'indulgence. Conséquences en cours d\'application.',
    'Faiblesse détectée. Pénalité activée.',
    'Défi abandonné. Le Système se souvient.',
    'Insuffisant. Le prix de l\'échec sera payé.',
];

const SYSTEM_SUCCESS_MESSAGES = [
    'Défi accompli. Le Système reconnaît ta force.',
    'Objectif atteint. Tu mérites ta récompense.',
    'Impressionnant. Continue à t\'améliorer.',
    'Mission accomplie. Le Système est satisfait — pour l\'instant.',
    'Tu as prouvé ta valeur. Prépare-toi pour le prochain.',
];

// ═══════════════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════
function getActiveChallenge() {
    try { return JSON.parse(localStorage.getItem(CHALLENGE_STORAGE.active) || 'null'); }
    catch(e) { return null; }
}
function saveActiveChallenge(challenge) {
    if (challenge) localStorage.setItem(CHALLENGE_STORAGE.active, JSON.stringify(challenge));
    else localStorage.removeItem(CHALLENGE_STORAGE.active);
}

function getActivePenalties() {
    try {
        const penalties = JSON.parse(localStorage.getItem(CHALLENGE_STORAGE.penalties) || '[]');
        // Nettoyer les pénalités expirées
        const now = Date.now();
        const active = penalties.filter(p => p.expiresAt > now);
        if (active.length !== penalties.length) {
            localStorage.setItem(CHALLENGE_STORAGE.penalties, JSON.stringify(active));
        }
        return active;
    } catch(e) { return []; }
}
function addPenalty(penaltyData) {
    const penalties = getActivePenalties();
    penalties.push(penaltyData);
    localStorage.setItem(CHALLENGE_STORAGE.penalties, JSON.stringify(penalties));
}
function clearPenalties() {
    localStorage.removeItem(CHALLENGE_STORAGE.penalties);
}

function _getChallengeHistory() {
    try {
        const profileId = typeof getCurrentProfileId === 'function' ? getCurrentProfileId() : null;
        const key = profileId ? `profile_${profileId}_workoutHistory` : 'workoutHistory';
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch(e) { return []; }
}

// ═══════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR DE DÉFI
// ═══════════════════════════════════════════════════════════════════════
function generateChallenge() {
    if (!getAdventureEnabled()) return null;

    // Pas de nouveau défi si un est déjà actif
    const existing = getActiveChallenge();
    if (existing && !isChallengeExpired(existing)) return existing;

    // Niveau du joueur pour adapter la difficulté
    const totalStats = typeof getPlayerTotalStats === 'function' ? getPlayerTotalStats() : { strength: 10 };
    const playerPower = Object.values(totalStats).reduce((s, v) => s + v, 0);
    const difficulty = playerPower < 80 ? 'easy' : playerPower < 200 ? 'medium' : 'hard';

    // Choisir un type de défi
    const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];

    // Choisir la cible selon la difficulté
    const targetIndex = difficulty === 'easy' ? 0 : difficulty === 'medium' ? Math.floor(type.targets.length / 2) : type.targets.length - 1;
    const target = type.targets[Math.min(targetIndex, type.targets.length - 1)];

    // Muscle aléatoire pour les défis muscle
    const muscles = ['Pectoraux', 'Dos', 'Épaules', 'Quadriceps', 'Fessiers', 'Abdominaux', 'Biceps', 'Triceps'];
    const muscle = muscles[Math.floor(Math.random() * muscles.length)];

    // Durée selon difficulté : 24h (easy) / 48h (medium) / 72h (hard)
    const durations = { easy: 24, medium: 48, hard: 72 };
    const hours = durations[difficulty];
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    // Pénalité aléatoire
    const penalty = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];

    // Message d'émission
    const issueMsg = SYSTEM_ISSUE_MESSAGES[Math.floor(Math.random() * SYSTEM_ISSUE_MESSAGES.length)];

    const challenge = {
        id: Date.now(),
        typeId: type.id,
        label: type.id === 'muscle' ? type.label(target, muscle) : type.label(target),
        icon: type.icon,
        units: type.units,
        target,
        muscle: type.id === 'muscle' ? muscle : null,
        difficulty,
        deadline,
        issuedAt: new Date().toISOString(),
        penaltyId: penalty.id,
        penaltyName: penalty.name,
        penaltyDesc: penalty.desc,
        penaltyIcon: penalty.icon,
        issueMessage: issueMsg,
        status: 'active', // active | completed | failed
        hours,
    };

    saveActiveChallenge(challenge);
    return challenge;
}

// ═══════════════════════════════════════════════════════════════════════
// VÉRIFICATION D'UN DÉFI
// ═══════════════════════════════════════════════════════════════════════
function isChallengeExpired(challenge) {
    return new Date(challenge.deadline) < new Date();
}

function getChallengeProgress(challenge) {
    const type = CHALLENGE_TYPES.find(t => t.id === challenge.typeId);
    if (!type) return 0;
    try { return type.check(challenge); }
    catch(e) { return 0; }
}

function isChallengeCompleted(challenge) {
    return getChallengeProgress(challenge) >= challenge.target;
}

// ── Appelé après chaque séance pour vérifier ──────────────────────────
function checkChallengeOnWorkoutComplete() {
    if (!getAdventureEnabled()) return;
    const challenge = getActiveChallenge();
    if (!challenge || challenge.status !== 'active') return;

    if (isChallengeCompleted(challenge)) {
        challenge.status = 'completed';
        saveActiveChallenge(challenge);
        const msg = SYSTEM_SUCCESS_MESSAGES[Math.floor(Math.random() * SYSTEM_SUCCESS_MESSAGES.length)];
        setTimeout(() => showChallengeResultModal(challenge, true, msg), 2500);
        return;
    }

    if (isChallengeExpired(challenge)) {
        failChallenge(challenge);
    }
}

function failChallenge(challenge) {
    challenge.status = 'failed';
    saveActiveChallenge(challenge);

    // Appliquer la pénalité
    const penaltyDef = PENALTIES.find(p => p.id === challenge.penaltyId);
    if (penaltyDef) {
        const penaltyData = penaltyDef.apply();
        addPenalty(penaltyData);
    }

    const msg = SYSTEM_FAIL_MESSAGES[Math.floor(Math.random() * SYSTEM_FAIL_MESSAGES.length)];
    showChallengeResultModal(challenge, false, msg);
}

// ── Check au démarrage de l'app ────────────────────────────────────────
function checkExpiredChallengeOnLoad() {
    if (!getAdventureEnabled()) return;
    const challenge = getActiveChallenge();
    if (!challenge || challenge.status !== 'active') return;
    if (isChallengeExpired(challenge) && !isChallengeCompleted(challenge)) {
        failChallenge(challenge);
    }
}

// ── Forcer un nouveau défi (pour tests) ────────────────────────────────
function forceNewChallenge() {
    saveActiveChallenge(null);
    const ch = generateChallenge();
    if (ch) {
        renderAdventureTab();
        showChallengeIssuedModal(ch);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// MODALS D'ALERTE DU SYSTÈME
// ═══════════════════════════════════════════════════════════════════════

function showChallengeIssuedModal(challenge) {
    const deadline = new Date(challenge.deadline);
    const dateStr = deadline.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });

    const modal = document.createElement('div');
    modal.id = 'challengeIssuedModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10002;
        background:rgba(0,0,0,0.95);
        display:flex;align-items:center;justify-content:center;
        padding:20px;
        animation:fadeIn 0.3s ease;
    `;
    modal.innerHTML = `
        <div style="
            width:100%;max-width:380px;
            background:#0a0a0a;border-radius:24px;
            padding:28px 22px;text-align:center;
            border:1.5px solid rgba(168,85,247,0.5);
            box-shadow:0 0 80px rgba(168,85,247,0.2), 0 0 200px rgba(168,85,247,0.05);
            animation:challengePop 0.6s cubic-bezier(0.34,1.2,0.64,1);
        ">
            <!-- Header système -->
            <div style="font-size:0.65em;color:rgba(168,85,247,0.7);font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px;">
                ⚠ ALERTE SYSTÈME ⚠
            </div>

            <!-- Icône -->
            <div style="font-size:3.5em;margin-bottom:14px;animation:pulseIcon 1.5s ease-in-out infinite;">${challenge.icon}</div>

            <!-- Message système -->
            <div style="font-size:0.82em;color:#a855f7;font-style:italic;margin-bottom:16px;line-height:1.5;">
                "${challenge.issueMessage}"
            </div>

            <!-- Défi -->
            <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.25);border-radius:14px;padding:16px;margin-bottom:16px;">
                <div style="font-size:0.65em;color:rgba(255,255,255,0.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mission assignée</div>
                <div style="font-size:1em;font-weight:800;color:white;line-height:1.4;">${challenge.label}</div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:8px;">⏰ Avant le ${dateStr}</div>
            </div>

            <!-- Conséquence -->
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px;margin-bottom:20px;">
                <div style="font-size:0.65em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">En cas d'échec</div>
                <div style="font-size:0.85em;font-weight:700;color:#f87171;">${challenge.penaltyIcon} ${challenge.penaltyName}</div>
                <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:4px;">${challenge.penaltyDesc}</div>
            </div>

            <button onclick="document.getElementById('challengeIssuedModal').remove();"
                    style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                           background:linear-gradient(135deg,#7c3aed,#4f46e5);
                           color:white;font-size:0.95em;font-weight:800;
                           box-shadow:0 4px 20px rgba(124,58,237,0.4);">
                ⚔️ Mission acceptée
            </button>
        </div>
        <style>
            @keyframes challengePop {
                from { transform: scale(0.8); opacity: 0; }
                to   { transform: scale(1); opacity: 1; }
            }
            @keyframes pulseIcon {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.12); }
            }
        </style>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    // Vibration "alerte"
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100, 200]);
}

function showChallengeResultModal(challenge, success, message) {
    const modal = document.createElement('div');
    modal.id = 'challengeResultModal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10002;
        background:rgba(0,0,0,0.95);
        display:flex;align-items:center;justify-content:center;
        padding:20px;
        animation:fadeIn 0.3s ease;
    `;

    const color = success ? '#22c55e' : '#ef4444';
    const glow  = success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';

    modal.innerHTML = `
        <div style="
            width:100%;max-width:380px;
            background:#0a0a0a;border-radius:24px;
            padding:28px 22px;text-align:center;
            border:1.5px solid ${color};
            box-shadow:0 0 80px ${glow};
            animation:challengePop 0.5s cubic-bezier(0.34,1.2,0.64,1);
        ">
            <div style="font-size:0.65em;color:${color};font-weight:700;text-transform:uppercase;letter-spacing:4px;margin-bottom:16px;">
                ${success ? '✦ SYSTÈME ✦' : '⚠ SYSTÈME ⚠'}
            </div>

            <div style="font-size:4em;margin-bottom:16px;">${success ? '🏆' : '💀'}</div>

            <div style="font-size:1.1em;font-weight:900;color:white;margin-bottom:12px;">
                ${success ? 'Défi Accompli' : 'Défi Échoué'}
            </div>

            <div style="font-size:0.82em;color:rgba(255,255,255,0.5);font-style:italic;margin-bottom:20px;line-height:1.6;">
                "${message}"
            </div>

            ${!success ? `
            <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px;margin-bottom:20px;">
                <div style="font-size:0.7em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Pénalité appliquée</div>
                <div style="font-size:0.9em;font-weight:800;color:#f87171;">${challenge.penaltyIcon} ${challenge.penaltyName}</div>
                <div style="font-size:0.75em;color:rgba(255,255,255,0.4);margin-top:4px;">${challenge.penaltyDesc}</div>
            </div>` : `
            <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:12px;padding:14px;margin-bottom:20px;">
                <div style="font-size:0.9em;color:#4ade80;font-weight:700;">+10% de chance de drop sur ta prochaine séance ✨</div>
            </div>`}

            <button onclick="document.getElementById('challengeResultModal').remove();renderAdventureTab();"
                    style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                           background:linear-gradient(135deg,${color},${color}cc);
                           color:white;font-size:0.95em;font-weight:800;
                           box-shadow:0 4px 20px ${glow};">
                ${success ? '🎉 Continuer' : '😤 Accepter la pénalité'}
            </button>
        </div>
    `;
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    if (navigator.vibrate) {
        if (success) navigator.vibrate([80, 40, 160]);
        else         navigator.vibrate([200, 100, 200, 100, 400]);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// RENDU UI — Section défi dans l'onglet aventure
// ═══════════════════════════════════════════════════════════════════════
function renderChallengeSection() {
    if (!getAdventureEnabled()) return '';

    // Vérifier expiration au rendu
    const challenge = getActiveChallenge();
    const penalties = getActivePenalties();

    // ── Pénalités actives ────────────────────────────────────────────
    let penaltyHtml = '';
    if (penalties.length > 0) {
        penaltyHtml = `
            <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:14px;margin-bottom:14px;">
                <div style="font-size:0.65em;color:#ef4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">⛓️ Pénalités actives</div>
                ${penalties.map(p => {
                    const remaining = Math.max(0, Math.round((p.expiresAt - Date.now()) / 3600000));
                    const label = p.type === 'stat_drain' ? `Stats -${Math.round((1-p.multiplier)*100)}%`
                                : p.type === 'xp_curse'  ? `XP -${Math.round((1-p.multiplier)*100)}%`
                                : p.type === 'drop_ban'  ? 'Drops bloqués'
                                : 'Double punition';
                    return `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(239,68,68,0.1);">
                            <span style="font-size:0.85em;font-weight:700;color:#f87171;">💀 ${label}</span>
                            <span style="font-size:0.72em;color:rgba(255,255,255,0.4);">Expire dans ${remaining}h</span>
                        </div>`;
                }).join('')}
            </div>`;
    }

    // ── Défi actif ───────────────────────────────────────────────────
    let challengeHtml = '';
    if (!challenge || challenge.status !== 'active') {
        // Pas de défi actif — afficher option d'en générer un
        const canGenerate = !challenge || challenge.status !== 'active';
        challengeHtml = `
            <div style="background:#0f0f0f;border:1.5px dashed rgba(168,85,247,0.3);border-radius:16px;padding:20px;text-align:center;margin-bottom:14px;">
                <div style="font-size:2em;margin-bottom:10px;">📜</div>
                <div style="font-weight:700;color:#e2e8f0;margin-bottom:6px;">Aucun défi actif</div>
                <div style="font-size:0.8em;color:#475569;margin-bottom:16px;">Le Système t'observera bientôt…</div>
                <button onclick="forceNewChallenge()"
                        style="padding:11px 20px;border-radius:12px;border:1px solid rgba(168,85,247,0.35);
                               background:rgba(168,85,247,0.1);color:#a855f7;
                               font-size:0.85em;font-weight:700;cursor:pointer;">
                    ⚔️ Invoquer un défi
                </button>
            </div>`;
    } else {
        const progress = getChallengeProgress(challenge);
        const pct = Math.min(100, Math.round((progress / challenge.target) * 100));
        const now = Date.now();
        const deadline = new Date(challenge.deadline);
        const msLeft = deadline - now;
        const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
        const minsLeft  = Math.max(0, Math.floor((msLeft % 3600000) / 60000));
        const isUrgent  = hoursLeft < 6;
        const urgentColor = isUrgent ? '#ef4444' : '#a855f7';

        challengeHtml = `
            <div style="
                background:linear-gradient(135deg,#0a0a14,#14001e);
                border:1.5px solid ${urgentColor}40;
                border-radius:16px;padding:16px;margin-bottom:14px;
                box-shadow:0 0 20px ${urgentColor}15;
            ">
                <!-- Header -->
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:0.62em;color:${urgentColor};font-weight:700;text-transform:uppercase;letter-spacing:2px;">
                        ${isUrgent ? '⚠️ URGENT' : '📜 DÉFI ACTIF'}
                    </div>
                    <div style="font-size:0.72em;font-weight:700;color:${isUrgent ? '#ef4444' : 'rgba(255,255,255,0.4)'};">
                        ${hoursLeft}h ${minsLeft}m restantes
                    </div>
                </div>

                <!-- Mission -->
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
                    <span style="font-size:1.8em;flex-shrink:0;">${challenge.icon}</span>
                    <div>
                        <div style="font-size:0.95em;font-weight:800;color:white;line-height:1.4;">${challenge.label}</div>
                        <div style="font-size:0.72em;color:rgba(255,255,255,0.4);margin-top:4px;">
                            Progression : ${progress} / ${challenge.target} ${challenge.units}
                        </div>
                    </div>
                </div>

                <!-- Barre progress -->
                <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:99px;overflow:hidden;margin-bottom:12px;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:99px;transition:width 0.5s ease;"></div>
                </div>

                <!-- Conséquence en cas d'échec -->
                <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:8px;">
                    <span style="font-size:1em;">${challenge.penaltyIcon}</span>
                    <div>
                        <span style="font-size:0.72em;color:#f87171;font-weight:600;">Échec → </span>
                        <span style="font-size:0.72em;color:rgba(255,255,255,0.5);">${challenge.penaltyName}</span>
                    </div>
                </div>
            </div>`;
    }

    return penaltyHtml + challengeHtml;
}

// ── Patch renderAdventureTab pour inclure les défis ─────────────────────
// This function REPLACES the one in adventure.js once challenges.js loads
function renderAdventureTab() {
    const container = document.getElementById('adventureContainer');
    if (!container) return;

    if (!getAdventureEnabled()) {
        container.innerHTML = typeof renderAdventureDisabled === 'function'
            ? renderAdventureDisabled()
            : '<div style="text-align:center;padding:40px;color:#64748b;">Mode aventure désactivé.</div>';
        return;
    }

    // Build full adventure HTML
    container.innerHTML = `
        ${renderChallengeSection()}
        ${typeof renderPlayerCard      === 'function' ? renderPlayerCard()      : ''}
        ${typeof renderEquipmentSlots  === 'function' ? renderEquipmentSlots()  : ''}
        ${typeof renderSetBonusesCard  === 'function' ? renderSetBonusesCard()  : ''}
        ${typeof renderInventoryCard   === 'function' ? renderInventoryCard()   : ''}
    `;

    startChallengeTimer();
}

// ── Timer live pour le compte à rebours du défi ─────────────────────────
let _challengeTimerInterval = null;
function startChallengeTimer() {
    clearInterval(_challengeTimerInterval);
    _challengeTimerInterval = setInterval(() => {
        const challenge = getActiveChallenge();
        if (!challenge || challenge.status !== 'active') {
            clearInterval(_challengeTimerInterval);
            return;
        }
        // Juste mettre à jour le texte du timer sans re-render tout
        const now = Date.now();
        const deadline = new Date(challenge.deadline);
        const msLeft = deadline - now;
        if (msLeft <= 0) {
            clearInterval(_challengeTimerInterval);
            if (!isChallengeCompleted(challenge)) failChallenge(challenge);
            renderAdventureTab();
            return;
        }
        const hoursLeft = Math.floor(msLeft / 3600000);
        const minsLeft  = Math.floor((msLeft % 3600000) / 60000);
        // Update timer display directly
        const timerEls = document.querySelectorAll('[data-challenge-timer]');
        timerEls.forEach(el => {
            el.textContent = `${hoursLeft}h ${minsLeft}m restantes`;
        });
    }, 30000); // Update every 30s
}

// ── Init ────────────────────────────────────────────────────────────────
function initChallengeSystem() {
    if (!getAdventureEnabled()) return;
    checkExpiredChallengeOnLoad();

    // Générer un défi si pas d'actif
    const challenge = getActiveChallenge();
    if (!challenge || challenge.status !== 'active') {
        // 70% de chance d'avoir un défi au démarrage
        if (Math.random() < 0.70) {
            const newChallenge = generateChallenge();
            if (newChallenge) {
                setTimeout(() => showChallengeIssuedModal(newChallenge), 3000);
            }
        }
    }
}
