// ═══════════════════════════════════════════════════════════════════
// Awakened — Carte de Séance Partageable (canvas → image)
// ═══════════════════════════════════════════════════════════════════
// Génère une vraie image (PNG) de résumé de séance, 2 formats :
//   - story  : 1080 × 1920 (9:16, Insta/TikTok)
//   - square : 1080 × 1080 (1:1, post Insta)
// Partage via Web Share API (fichier), fallback téléchargement.
// 100% local, aucune dépendance externe.
// ═══════════════════════════════════════════════════════════════════
(function() {
'use strict';

// Citations courtes pour la carte (ton Solo Leveling)
const SHARE_QUOTES = [
    "Le Système enregistre chaque effort.",
    "Lève-toi, Joueur. Tu es plus fort qu'hier.",
    "La discipline forge les Monarques.",
    "Chaque répétition te rapproche du sommet.",
    "Les faibles cherchent le confort. Toi, la croissance.",
    "Aucune excuse. Seulement des actions.",
    "Tu as franchi la Faille. Encore.",
    "La force réelle ne ment pas.",
    "Ce qui ne progresse pas régresse.",
    "Deviens le Monarque de ta propre vie."
];

function pickQuote() {
    return SHARE_QUOTES[Math.floor(Math.random() * SHARE_QUOTES.length)];
}

// Dessine un rectangle arrondi
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Génère la carte. data = { name, date, rank, xp, minutes, exercises, sets, kcal, volume, streak, muscles[], quote, format }
// Retourne une Promise<Blob>
function generateShareCard(data) {
    return new Promise((resolve) => {
        const isStory = data.format === 'story';
        const W = 1080;
        const H = isStory ? 1920 : 1080;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // ── Fond dégradé sombre cyberpunk ──
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0a0e16');
        grad.addColorStop(0.5, '#0d1422');
        grad.addColorStop(1, '#0a0e16');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Glow vert/violet décoratifs
        const radial1 = ctx.createRadialGradient(W * 0.15, H * 0.12, 0, W * 0.15, H * 0.12, W * 0.5);
        radial1.addColorStop(0, 'rgba(74,222,128,0.12)');
        radial1.addColorStop(1, 'rgba(74,222,128,0)');
        ctx.fillStyle = radial1;
        ctx.fillRect(0, 0, W, H);
        const radial2 = ctx.createRadialGradient(W * 0.85, H * 0.9, 0, W * 0.85, H * 0.9, W * 0.5);
        radial2.addColorStop(0, 'rgba(168,85,247,0.12)');
        radial2.addColorStop(1, 'rgba(168,85,247,0)');
        ctx.fillStyle = radial2;
        ctx.fillRect(0, 0, W, H);

        // Cadre néon
        ctx.strokeStyle = 'rgba(74,222,128,0.35)';
        ctx.lineWidth = 3;
        roundRect(ctx, 30, 30, W - 60, H - 60, 28);
        ctx.stroke();

        const cx = W / 2;
        let y = isStory ? 180 : 90;

        // ── En-tête "SYSTÈME" ──
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4ade80';
        ctx.font = '700 32px Arial';
        ctx.fillText('⚡ AWAKENED · LE SYSTÈME', cx, y);
        y += isStory ? 90 : 70;

        // ── Nom de séance ──
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 ' + (isStory ? '64px' : '56px') + ' Arial';
        const name = (data.name || 'Séance terminée').toUpperCase();
        wrapText(ctx, name, cx, y, W - 160, isStory ? 70 : 62);
        y += isStory ? 80 : 70;

        // Date
        ctx.fillStyle = '#c084fc';
        ctx.font = '600 30px Arial';
        ctx.fillText(data.date || '', cx, y);
        y += isStory ? 110 : 80;

        // ── Badge de RANG (gros, central) ──
        if (data.rank) {
            const badgeR = isStory ? 110 : 90;
            const by = y + badgeR;
            // Cercle glow
            const rg = ctx.createRadialGradient(cx, by, 0, cx, by, badgeR + 20);
            rg.addColorStop(0, 'rgba(168,85,247,0.4)');
            rg.addColorStop(1, 'rgba(168,85,247,0)');
            ctx.fillStyle = rg;
            ctx.beginPath();
            ctx.arc(cx, by, badgeR + 20, 0, Math.PI * 2);
            ctx.fill();
            // Cercle
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, by, badgeR, 0, Math.PI * 2);
            ctx.stroke();
            // Lettre de rang
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 ' + (isStory ? '120px' : '100px') + ' Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(data.rank.id || data.rank, cx, by + 4);
            ctx.textBaseline = 'alphabetic';
            // Label "RANG"
            ctx.fillStyle = '#a855f7';
            ctx.font = '700 28px Arial';
            ctx.fillText('RANG', cx, by - badgeR - 14);
            y = by + badgeR + (isStory ? 100 : 70);
        }

        // ── Grille de stats ──
        const stats = [
            { val: data.minutes + '', label: '⏱ MIN', color: '#4ade80' },
            { val: data.exercises + '', label: '💪 EXOS', color: '#c084fc' },
            { val: data.kcal + '', label: '🔥 KCAL', color: '#fbbf24' }
        ];
        // Deuxième rangée : adaptative selon mode jeu.
        // Si jeu actif (rank présent) : XP · Séries · Streak
        // Sinon : Séries · Volume · Streak (pas de XP qui n'aurait aucun sens)
        let stats2;
        if (data.rank) {
            stats2 = [
                { val: '+' + (data.xp || 0), label: '⚡ XP', color: '#4ade80' },
                { val: data.sets + '', label: '📊 SÉRIES', color: '#06b6d4' },
                { val: (data.streak || 0) + 'j', label: '🔥 STREAK', color: '#f59e0b' }
            ];
        } else {
            const volShort = (data.volume && data.volume > 0)
                ? (data.volume >= 1000 ? (Math.round(data.volume / 100) / 10) + 'k' : data.volume + '')
                : '—';
            stats2 = [
                { val: data.sets + '', label: '📊 SÉRIES', color: '#06b6d4' },
                { val: volShort, label: '🏋 VOLUME', color: '#c084fc' },
                { val: (data.streak || 0) + 'j', label: '🔥 STREAK', color: '#f59e0b' }
            ];
        }

        const drawStatRow = (arr, yy) => {
            const boxW = (W - 160 - 40) / 3;
            const boxH = isStory ? 150 : 130;
            let bx = 80;
            arr.forEach(s => {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                roundRect(ctx, bx, yy, boxW, boxH, 18);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.12)';
                ctx.lineWidth = 2;
                roundRect(ctx, bx, yy, boxW, boxH, 18);
                ctx.stroke();
                ctx.fillStyle = s.color;
                ctx.font = '900 ' + (isStory ? '56px' : '48px') + ' Arial';
                ctx.textAlign = 'center';
                ctx.fillText(s.val, bx + boxW / 2, yy + (isStory ? 78 : 68));
                ctx.fillStyle = 'rgba(255,255,255,0.65)';
                ctx.font = '700 26px Arial';
                ctx.fillText(s.label, bx + boxW / 2, yy + (isStory ? 118 : 105));
                bx += boxW + 20;
            });
        };
        drawStatRow(stats, y);
        y += (isStory ? 150 : 130) + 20;
        drawStatRow(stats2, y);
        y += (isStory ? 150 : 130) + (isStory ? 70 : 50);

        // ── Muscles travaillés (pills) ──
        if (data.muscles && data.muscles.length > 0) {
            ctx.font = '700 30px Arial';
            const pills = data.muscles.slice(0, 5);
            // Calculer largeur totale pour centrer
            const gaps = 16;
            const padX = 28;
            let totalW = 0;
            const widths = pills.map(m => {
                const w = ctx.measureText(m).width + padX * 2;
                totalW += w + gaps;
                return w;
            });
            totalW -= gaps;
            let px = cx - totalW / 2;
            const pillH = 56;
            pills.forEach((m, i) => {
                ctx.fillStyle = 'rgba(74,222,128,0.15)';
                roundRect(ctx, px, y, widths[i], pillH, pillH / 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(74,222,128,0.4)';
                ctx.lineWidth = 2;
                roundRect(ctx, px, y, widths[i], pillH, pillH / 2);
                ctx.stroke();
                ctx.fillStyle = '#4ade80';
                ctx.textAlign = 'center';
                ctx.fillText(m, px + widths[i] / 2, y + 38);
                px += widths[i] + gaps;
            });
            y += pillH + (isStory ? 90 : 60);
        }

        // ── Volume détaillé (uniquement si jeu actif, sinon déjà dans la grille) ──
        if (data.rank && data.volume && data.volume > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '600 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Volume total : ' + data.volume.toLocaleString() + ' ' + (data.unit || 'kg'), cx, y);
            y += isStory ? 90 : 60;
        }

        // ── Citation du Système ──
        if (data.quote) {
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'italic 600 ' + (isStory ? '38px' : '34px') + ' Arial';
            wrapText(ctx, '« ' + data.quote + ' »', cx, isStory ? H - 200 : H - 150, W - 200, 50);
        }

        // ── Watermark ──
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '700 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AWAKENED', cx, H - (isStory ? 90 : 70));

        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
}

// Texte multi-ligne centré
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
        const test = line + words[n] + ' ';
        if (ctx.measureText(test).width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = test;
        }
    }
    lines.push(line.trim());
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

window.generateShareCard = generateShareCard;
window.pickShareQuote    = pickQuote;

})();
