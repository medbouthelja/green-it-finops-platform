# API Symfony 7 — Green IT & FinOps

Backend JSON pour le frontend React (`/api`, port **8000**).

## Prérequis

- PHP **8.2+** avec extensions : `ctype`, `iconv`, `json`, `pdo`, `pdo_sqlite`
- [Composer](https://getcomposer.org/)

## Installation

```bash
cd backend
composer install
```

Créer la base SQLite et charger les données de démo :

```bash
php bin/console doctrine:schema:update --force
php bin/console doctrine:fixtures:load --no-interaction
```

Si vous avez déjà des données et que seul **admin** fonctionne, créez ou mettez à jour les trois comptes de démo **sans effacer les projets** :

```bash
php bin/console app:create-demo-users
```

## Lancer le serveur

```bash
php -S localhost:8000 -t public
```

Ou avec le CLI Symfony si installé :

```bash
symfony server:start --port=8000
```

L’API est disponible sur `http://localhost:8000/api`.

## Comptes de démo (fixtures)

| Email | Mot de passe | Rôle (API → app) |
|-------|--------------|------------------|
| `admin@example.com` | `password` | ADMIN |
| `manager@example.com` | `password` | MANAGER |
| `techlead@example.com` | `password` | TECH_LEAD |

## Variables d’environnement

Copier `.env` vers `.env.local` pour surcharger :

- `JWT_PASSPHRASE` — secret de signature JWT (min. 32 caractères en production)
- `APP_SECRET` — secret Symfony

## Endpoints principaux

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/api/auth/login` | `{ "email", "password" }` → `{ token, user }` |
| GET | `/api/projects` | Liste des projets |
| GET/POST/PUT/DELETE | `/api/projects` … | CRUD |
| GET | `/api/finops/projects/{id}/consumption` | Données conso cloud |
| GET | `/api/finops/projects/{id}/recommendations` | Recommandations FinOps |
| POST | `/api/simulations/projects/{id}` | Simulation budgétaire |
| GET | `/api/alerts` | Alertes (`?projectId=` optionnel) |

Toutes les routes sauf `POST /api/auth/login` exigent l’en-tête :

`Authorization: Bearer <token>`

## Frontend

Dans le dossier du frontend, sans mode démo :

```env
# .env ou .env.local — ne pas définir VITE_DEMO_MODE ou le laisser à false
VITE_DEMO_MODE=false
```

Le proxy Vite (`vite.config.js`) envoie déjà `/api` vers `http://localhost:8000`.

## Production

- Utiliser une vraie base (MySQL/PostgreSQL) : définir `DATABASE_URL` et adapter `config/packages/doctrine.yaml`.
- Générer `APP_SECRET` et `JWT_PASSPHRASE` forts.
- Désactiver `APP_DEBUG`.
