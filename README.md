# Green IT / FinOps Platform

Application **React (Vite)** + **API Symfony 7** avec **PostgreSQL**. Gestion multi-entreprises, projets, budget, FinOps et assistant IA.

## Prérequis

| Composant | Détail |
|-----------|--------|
| Node.js | 18+ recommandé |
| PHP | 8.2+ avec `pdo_pgsql` activé (`extension=pdo_pgsql` dans `php.ini`) |
| PostgreSQL | 15+ en local, ou Docker (voir `backend/docker-compose.yml`) |
| Composer | Dernière version stable |

Sous **Windows**, si `pdo_pgsql` est absent : éditez `php.ini`, décommentez `extension=pdo_pgsql`, assurez-vous que `libpq.dll` est accessible (souvent fourni avec l’installation PHP PostgreSQL), puis redémarrez le terminal.

## Démarrage rapide

### 1. Base de données PostgreSQL

**Avec Docker** (dans le dossier `backend`) :

```bash
cd backend
docker compose up -d
```

**Sans Docker** : créez une base et un utilisateur correspondant à `DATABASE_URL` dans `backend/.env` (par défaut : base `greenit`, utilisateur `greenit`, mot de passe `greenit`).

### 2. Backend

PowerShell (utilisez `;` au lieu de `&&` si besoin) :

```powershell
cd backend
composer install
php bin/console doctrine:schema:update --force
php bin/console doctrine:fixtures:load --no-interaction
php -S localhost:8000 -t public
```

L’API : `http://localhost:8000/api` — détail des routes : [backend/README.md](backend/README.md).

### 3. Frontend

Nouveau terminal, à la racine du dépôt :

```powershell
npm install
copy .env.example .env.local
npm run dev
```

L’app : `http://localhost:3000` — le proxy Vite envoie `/api` vers le port 8000.

**Comptes de démo** (fixtures) : `admin@example.com`, `manager@example.com`, `techlead@example.com` — mot de passe `password`.

### 4. Sans backend (démo UI seule)

Dans `.env.local` à la racine :

```env
VITE_DEMO_MODE=true
```

## Scripts npm

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur Vite (dev) |
| `npm run build` | Build production dans `dist/` |
| `npm run preview` | Prévisualiser le build |
| `npm run lint` | ESLint sur `src/` |
| `npm run check` | Lint + build (sanité du frontend) |

## Structure

- `src/` — application React
- `backend/` — API Symfony, `docker-compose.yml` (PostgreSQL), `.env` / `.env.local`

## Dépannage

- **Connexion API refusée** : vérifiez que `php -S localhost:8000 -t public` tourne depuis `backend/`.
- **Erreur Doctrine / PostgreSQL** : PostgreSQL démarré, `DATABASE_URL` correcte, extension `pdo_pgsql` chargée (`php -m` doit lister `pdo_pgsql`).
- **Port 5432 déjà utilisé** : changez le mapping dans `docker-compose.yml` ou arrêtez l’autre instance PostgreSQL.
