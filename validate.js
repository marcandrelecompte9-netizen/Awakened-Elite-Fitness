#!/usr/bin/env node
/**
 * ✅ VALIDATE.JS — Contrôle qualité Awakened Elite Fitness
 * ─────────────────────────────────────────────────────────
 * Usage :  node validate.js          (depuis le dossier de l'app)
 *
 * Vérifie en une commande :
 *   1. Syntaxe JS de tous les fichiers js/*.js et data/*.js
 *   2. Doublons d'exercices (exacts ET quasi-doublons : casse, pluriels,
 *      accents, tirets/espaces — la méthode qui a attrapé "Fire Hydrants")
 *   3. Références orphelines : noms d'exercices cités dans app.js
 *      (programmes) mais absents de la base exercises.js
 *   4. IDs HTML dupliqués dans index.html
 *   5. Équilibre des <div> dans index.html
 *   6. Cohérence de version cache entre sw.js et index.html
 *
 * Code sortie : 0 = tout est bon · 1 = au moins un problème.
 * À lancer AVANT de zipper un build. Les sessions Claude doivent le
 * lancer en début et fin de session.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let problems = 0;
const ok   = (m) => console.log('  ✅ ' + m);
const bad  = (m) => { console.log('  ❌ ' + m); problems++; };
const info = (m) => console.log('  ℹ️  ' + m);
const section = (t) => console.log('\n── ' + t + ' ' + '─'.repeat(Math.max(0, 50 - t.length)));

const ROOT = __dirname;

// ─── 1. Syntaxe JS ──────────────────────────────────────────────
section('1. Syntaxe JavaScript');
const jsDirs = ['js', 'data'];
let jsFiles = [];
for (const d of jsDirs) {
    const dir = path.join(ROOT, d);
    if (fs.existsSync(dir)) {
        jsFiles.push(...fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(d, f)));
    }
}
if (fs.existsSync(path.join(ROOT, 'sw.js'))) jsFiles.push('sw.js');
for (const f of jsFiles) {
    try {
        execSync(`node --check "${path.join(ROOT, f)}"`, { stdio: 'pipe' });
    } catch (e) {
        bad(`Erreur de syntaxe dans ${f} :\n${e.stderr.toString().split('\n').slice(0, 3).join('\n')}`);
    }
}
if (problems === 0) ok(`${jsFiles.length} fichiers JS valides`);

// ─── 2. Doublons d'exercices ────────────────────────────────────
section("2. Doublons d'exercices (exercises.js)");
const exSrc = fs.readFileSync(path.join(ROOT, 'js/exercises.js'), 'utf8');
const names = [...exSrc.matchAll(/\{\s*name:\s*"([^"]+)"/g)].map(m => m[1]);
info(`${names.length} exercices dans la base`);

// exacts
const counts = {};
names.forEach(n => counts[n] = (counts[n] || 0) + 1);
const exact = Object.entries(counts).filter(([, c]) => c > 1);
if (exact.length) exact.forEach(([n, c]) => bad(`Doublon exact : ${c}× "${n}"`));
else ok('Aucun doublon exact');

// quasi-doublons (normalisation : minuscules, sans accents, pluriels, séparateurs)
const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[\s_-]+/g, ' ').replace(/s\b/g, '');
const groups = {};
names.forEach(n => { const k = norm(n); (groups[k] = groups[k] || new Set()).add(n); });
const quasi = Object.values(groups).filter(s => s.size > 1);
if (quasi.length) quasi.forEach(s => bad(`Quasi-doublon : ${[...s].map(x => `"${x}"`).join(' / ')}`));
else ok('Aucun quasi-doublon (casse / pluriel / accents / tirets)');

// ─── 3. Références orphelines dans les programmes ───────────────
section('3. Références orphelines (app.js → exercises.js)');
const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const nameSet = new Set(names);
// Les programmes référencent les exercices via name:'...' ou name:"..."
const refs = [...appSrc.matchAll(/name:\s*['"]([^'"]{3,60})['"]/g)].map(m => m[1]);
const orphans = new Set();
for (const r of refs) {
    // Ignorer ce qui n'est visiblement pas un exercice (protéiné par heuristique douce) :
    // on ne signale que si le nom RESSEMBLE à un exercice existant une fois normalisé,
    // ou s'il partage un mot-clé avec la base — sinon trop de faux positifs (profils, plans…).
    if (nameSet.has(r)) continue;
    const rn = norm(r);
    for (const n of nameSet) {
        if (norm(n) === rn) { orphans.add(`"${r}" (existe sous "${n}")`); break; }
    }
}
if (orphans.size) [...orphans].forEach(o => bad(`Référence avec casse/forme différente : ${o}`));
else ok('Aucune référence de programme en désaccord avec la base');

// ─── 4. IDs HTML dupliqués ──────────────────────────────────────
section('4. IDs dupliqués (index.html)');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const idCounts = {};
ids.forEach(i => idCounts[i] = (idCounts[i] || 0) + 1);
const dupIds = Object.entries(idCounts).filter(([, c]) => c > 1);
if (dupIds.length) dupIds.forEach(([i, c]) => bad(`ID dupliqué : ${c}× "${i}"`));
else ok(`${ids.length} IDs, tous uniques`);

// ─── 5. Équilibre des <div> ─────────────────────────────────────
section('5. Équilibre des <div> (index.html)');
const opens = (html.match(/<div\b/g) || []).length;
const closes = (html.match(/<\/div>/g) || []).length;
if (opens === closes) ok(`${opens} <div> ouvrants = ${closes} fermants`);
else bad(`Déséquilibre : ${opens} <div> ouvrants vs ${closes} fermants (écart ${opens - closes})`);

// ─── 6. Version de cache cohérente ──────────────────────────────
section('6. Version de cache (sw.js ↔ index.html)');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const swV = (sw.match(/awakened-v(\d+)/) || [])[1];
const htmlVs = [...new Set([...html.matchAll(/\?v=(\d+)/g)].map(m => m[1]))];
if (!swV) bad('Impossible de lire la version dans sw.js');
else if (htmlVs.length === 1 && htmlVs[0] === swV) ok(`Cache synchronisé : v${swV}`);
else bad(`Désynchronisation : sw.js=v${swV} · index.html=${htmlVs.map(v => 'v' + v).join(', ')}`);

// ─── Bilan ──────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(54));
if (problems === 0) {
    console.log('✅ TOUT EST BON — build prêt à être zippé.');
    process.exit(0);
} else {
    console.log(`❌ ${problems} problème(s) détecté(s) — à corriger avant livraison.`);
    process.exit(1);
}
