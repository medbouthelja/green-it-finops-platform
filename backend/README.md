# API Symfony 7 — Green IT & FinOps

Backend JSON pour le frontend React (`/api`, port **8000**). La persistance est **exclusivement PostgreSQL** (Doctrine DBAL).

## Prérequis

- PHP **8.2+** avec extensions : `ctype`, `iconv`, `json`, `pdo`, **`pdo_pgsql`** (obligatoire au runtime ; vérifiez avec `php -m | findstr pgsql` sous Windows)
- **PostgreSQL** 15+ (ou conteneur Docker, voir ci-dessous)
- [Composer](https://getcomposer.org/)

Après `composer install`, un avertissement **suggest** `ext-pdo_pgsql` est normal tant que l’extension n’est pas activée dans `php.ini`.

## Installation

```bash
cd backend
composer install
```

### Base de données PostgreSQL

**Option A — Docker** (recommandé en local, aligné sur `.env`) :

```bash
docker compose up -d
```

Attendez que le conteneur soit prêt (`healthy`), puis :

```bash
php bin/console doctrine:schema:update --force
# ou, si vous préférez les migrations (rattrapage schéma « companies » sur une vieille base) :
# php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
```

**Option B — PostgreSQL installé sur la machine**

1. Créez un utilisateur et une base (exemple : utilisateur `greenit`, base `greenit`) :

```bash
# Linux / macOS — en tant que superutilisateur postgres
createuser -P greenit
createdb -O greenit greenit
```

Sous Windows : **pgAdmin** ou outils en PATH, même logique.

2. Ajustez `DATABASE_URL` dans `.env` ou `.env.local` (mot de passe, port, `serverVersion` = version majeure PG, ex. `16`).

3. Créez les tables et chargez les fixtures :

```bash
php bin/console doctrine:schema:update --force
php bin/console doctrine:fixtures:load --no-interaction
```

Si **POST /api/companies** renvoie une erreur 500 alors que vous êtes admin, la table `companies` est souvent absente : exécutez `php bin/console doctrine:schema:update --force` **ou** `php bin/console doctrine:migrations:migrate --no-interaction`, puis rechargez les fixtures si besoin.

### Schéma incohérent / réinitialisation

En cas d’erreur de contrainte ou de schéma obsolète : supprimez les tables dans la base (ou recréez une base vide), puis relancez `doctrine:schema:update --force` et éventuellement les fixtures.

Si vous avez déjà des données et que seul **admin** fonctionne, mettez à jour les trois comptes de démo **sans effacer les projets** :

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

- `DATABASE_URL` — DSN PostgreSQL Doctrine (`postgresql://...`)
- `JWT_PASSPHRASE` — secret de signature JWT (min. 32 caractères en production)
- `APP_SECRET` — secret Symfony

## Endpoints principaux

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/api/auth/login` | `{ "email", "password" }` → `{ token, user }` (user peut inclure `company` : `{ id, name }` ou `null`) |
| GET/POST/PUT/DELETE | `/api/companies` | **ROLE_ADMIN uniquement** — CRUD entreprises ; `GET ?q=&sector=` recherche / filtre |
| GET | `/api/projects` | Liste des projets (filtrée par entreprise pour les rôles non admin) |
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

- `DATABASE_URL` PostgreSQL fort, utilisateur à privilèges limités, SSL si exposé.
- Générer `APP_SECRET` et `JWT_PASSPHRASE` forts.
- Désactiver `APP_DEBUG`.
- Préférer les **migrations** Doctrine (`doctrine:migrations:migrate`) plutôt que `schema:update` sur les environnements partagés.
