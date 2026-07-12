# Awakened

## Structure du projet

```
fitpro/
├── index.html          ← Structure HTML principale
├── manifest.json       ← Config PWA (installable)
├── sw.js               ← Service worker (mode hors-ligne)
├── css/
│   └── style.css       ← Tous les styles de l'app
├── js/
│   ├── exercises.js    ← Base de données des exercices (642 lignes)
│   └── app.js          ← Logique principale de l'app (24 000 lignes)
├── data/               ← Pour les données futures (monstres, équipements RPG)
└── icons/              ← Icônes PWA (à ajouter)
```

## Déploiement GitHub Pages

1. Crée un compte sur github.com
2. Nouveau repository → "fitpro"
3. Upload tous ces fichiers
4. Settings → Pages → Source: main branch
5. Ton app est disponible sur `tonnom.github.io/fitpro`

## Prochaines étapes

- [ ] Ajouter les icônes PWA (icons/icon-192.png et icons/icon-512.png)
- [ ] Développer `js/adventure.js` — système d'aventure RPG
- [ ] Créer `data/monsters.js` — monstres et équipements
- [ ] Créer `data/items.js` — armures, armes, accessoires

## Licence

**© 2026 Marc-André Lecompte — Tous droits réservés.**

L'application **Awakened Elite Fitness** est offerte **gratuitement** au public :
utilise-la librement pour tes entraînements.

Le code source est visible ici à des fins de **consultation uniquement**. Il
n'est **ni libre ni open source** : la copie, la modification, la
redistribution ou la réutilisation du code, des images et des contenus — dans
un projet personnel ou commercial — sont interdites sans autorisation écrite
préalable.

Voir le fichier [LICENSE](LICENSE) pour les termes complets.

> ⚕️ **Avertissement santé** — Cette application fournit des informations
> générales de conditionnement physique à titre éducatif et ne constitue pas un
> avis médical. Consulte un professionnel de la santé avant d'entreprendre tout
> programme d'entraînement.
