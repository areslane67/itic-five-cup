# ITIC Five Cup — préinscriptions

Application complète : **React (Vite)** + **API Node/Express** + **base MySQL/MariaDB** (phpMyAdmin).

```
client/   Front React (parcours d'inscription + espace BDE)
server/   API Express (mysql2), authentification admin
database/ schema.sql (tables) et seed.sql (données fictives)
```

## Démarrage en local

Prérequis : Node.js 20 ou plus, MySQL/MariaDB (ex. XAMPP + phpMyAdmin).

1. Dans phpMyAdmin, créer la base `itic` (interclassement `utf8mb4_unicode_ci`), puis onglet **SQL** ou **Importer** :
   importer `database/schema.sql`, et si besoin `database/seed.sql` (données fictives : lien capitaine de démo `/capitaine/demo-capitaine-titan4-000000`).
2. Lancer :

```bash
npm install
cp .env.example .env        # puis éditer DB_*, ADMIN_PASSWORD et JWT_SECRET
npm run dev                 # front : http://localhost:5173  ·  API : http://localhost:3001
```

Espace BDE : `/admin` (mot de passe = `ADMIN_PASSWORD`).

## Production

```bash
npm install
npm run build               # compile le front dans client/dist
NODE_ENV=production npm start
```

Le serveur Express sert alors l'API **et** le front sur le même port (`PORT`, 3001 par défaut).
En production, `ADMIN_PASSWORD` et `JWT_SECRET` sont obligatoires, sinon le serveur refuse de démarrer.

Hébergement : un hébergeur Node + une base MySQL/MariaDB accessible (renseigner `DB_*`).
Servir en HTTPS (cookie admin « Secure »). Sauvegarde : export régulier de la base depuis phpMyAdmin.

## Modération par les capitaines

Pas de comptes : l'accès repose sur des **liens secrets** (longs, aléatoires, impossibles à deviner).

- **Capitaine** : à la création de l'équipe, il reçoit `/capitaine/<token>`. Il y voit les demandes en attente
  (nom, classe, niveau) et clique sur **Accepter** ou **Refuser**. La page se rafraîchit toute seule.
  L'effectif est vérifié à l'acceptation : impossible de dépasser le maximum.
- **Joueur** : en rejoignant une équipe, il envoie une **demande** (`pending`). Il reçoit `/suivi/<token>` pour voir
  la réponse (en attente / acceptée / refusée). S'il est refusé, il peut choisir une autre équipe ou s'inscrire en solo.
- **BDE** : voit les demandes en attente dans le tableau de bord, et peut récupérer le lien capitaine d'une équipe
  (bouton « Lien capitaine ») si un capitaine l'a perdu.
- Les liens sont aussi mémorisés dans le navigateur (boutons « Gérer mon équipe » / « Suivre mon inscription » sur l'accueil).
- Seuls les joueurs **acceptés** comptent dans l'effectif d'une équipe.

Base déjà créée ? Exécuter une fois `database/migration_moderation.sql` dans phpMyAdmin.

## Ce qui a été migré du prototype

| Prototype | Maintenant |
|---|---|
| Données en mémoire | Tables MySQL : `event`, `teams`, `participants` |
| Mot de passe `bde` côté navigateur | Connexion serveur, session JWT en cookie `httpOnly`, limitation des essais |
| Validation côté navigateur | Validation serveur (zod) + contrôles côté navigateur |
| Effectif d'équipe vérifié en JS | Vérifié dans une transaction SQL avec verrou (pas de dépassement si deux joueurs valident en même temps) |
| Codes d'équipe courts (4 caractères) | Codes de 6 caractères aléatoires |
| Liens `#/equipe/CODE` | Liens `/equipe/CODE` |
| Export CSV « prévu » | Fait : `/api/admin/export.csv` (UTF-8, séparateur `;`, ouvrable dans Excel) |
| Date, lieu, prix vides | Modifiables depuis l'espace BDE |

Ajouts mineurs dans l'espace BDE : annuler une inscription, fermer/rouvrir une équipe.

## API

Publique : `GET /api/event` · `GET /api/teams?promo=` · `GET /api/teams/:code` ·
`GET /api/teams/name-available?promo=&name=` · `POST /api/registrations`

Admin (cookie requis) : `POST /api/admin/login|logout` · `GET /api/admin/dashboard` ·
`PATCH /api/admin/event` · `PATCH|DELETE /api/admin/participants/:id` ·
`PATCH /api/admin/teams/:id` · `GET /api/admin/export.csv`

## Points d'attention

- Les données personnelles (nom, contact) ne sont jamais renvoyées par l'API publique.
- Les cellules CSV commençant par `= + - @` sont neutralisées (injection de formules Excel).
- Logo officiel ITIC et visuels du tournoi : toujours à ajouter (le logo actuel est un blason dessiné en CSS).
- Mentions RGPD / durée de conservation : à valider avec l'école.
