# Plateforme SaaS Green IT & FinOps

Plateforme web SaaS pour le pilotage financier, technique et environnemental des projets IT.

## 🚀 Technologies

- **React 18** - Bibliothèque UI
- **Vite** - Build tool et dev server
- **Tailwind CSS** - Framework CSS utilitaire
- **Recharts** - Bibliothèque de graphiques
- **React Router** - Routage
- **Zustand** - Gestion d'état légère
- **Axios** - Client HTTP
- **React Hot Toast** - Notifications
- **jsPDF & xlsx** - Export PDF/Excel

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 🏗️ Build

```bash
npm run build
```

## 📁 Structure du projet

```
src/
├── components/     # Composants réutilisables
│   ├── Layout.jsx          # Layout principal avec sidebar
│   ├── ProtectedRoute.jsx  # Route protégée par authentification
│   ├── Loading.jsx         # Composant de chargement
│   └── EmptyState.jsx      # État vide
├── pages/          # Pages de l'application
│   ├── Login.jsx           # Page de connexion
│   ├── Dashboard.jsx      # Tableau de bord principal
│   ├── Projects.jsx         # Liste des projets
│   ├── ProjectDetail.jsx   # Détail d'un projet
│   ├── Budget.jsx          # Gestion budgétaire
│   ├── FinOps.jsx          # FinOps & Green IT
│   ├── Simulation.jsx      # Simulation "Et si"
│   └── Settings.jsx        # Paramètres
├── services/       # Services API
│   ├── api.js              # Configuration Axios
│   ├── authService.js      # Authentification
│   ├── projectService.js   # Gestion des projets
│   ├── finopsService.js    # FinOps
│   ├── alertService.js     # Alertes
│   └── simulationService.js # Simulations
├── store/          # Gestion d'état (Zustand)
│   ├── authStore.js        # Store d'authentification
│   └── alertStore.js       # Store des alertes
├── utils/          # Utilitaires
│   ├── roles.js            # Gestion des rôles RBAC
│   ├── formatters.js       # Formatage des données
│   ├── export.js           # Export PDF/Excel
│   ├── constants.js        # Constantes
│   └── errorHandler.js     # Gestion des erreurs
└── hooks/          # Hooks personnalisés
    └── useProjects.js       # Hook pour les projets
```

## 🎯 Fonctionnalités

### ✅ Authentification & Sécurité
- Authentification JWT
- Gestion des rôles (RBAC)
- Routes protégées
- Isolation multi-tenant

### ✅ Gestion des Projets
- Création et gestion de projets
- Support Scrum et Cycle en V
- Suivi de l'avancement
- Gestion des équipes

### ✅ Suivi Budgétaire
- Suivi des coûts (TJM × heures)
- Comparaison budget vs consommé
- Prévisions et écarts
- Graphiques d'évolution

### ✅ FinOps & Green IT
- Suivi consommation cloud
- Estimation des coûts
- Métriques environnementales (CO₂)
- Recommandations d'optimisation

### ✅ Alertes & Notifications
- Alertes en temps réel
- Notifications de dépassement
- Gestion des risques

### ✅ Simulation "Et si"
- Simulation de scénarios
- Variation TJM, avancement, consommation
- Impact sur la rentabilité

### ✅ Reporting
- Export PDF
- Export Excel
- Tableaux de bord interactifs

### ✅ Assistant IA
- Chat assistant pour questions projet / budget / FinOps
- Reponses basees sur le contexte reel (projets + alertes)
- Compatible fournisseur IA externe via API key

## 🔐 Rôles

- **ADMIN** : Accès complet
- **MANAGER** : Vision globale, budget, FinOps, simulation, gestion des projets et de l’équipe
- **TECH_LEAD** : Dashboard, projets (consultation), suivi technique, FinOps, saisie du temps

## 🔧 Configuration

Créez un fichier `.env` à la racine :

```env
VITE_API_URL=http://localhost:8000/api
```

Configuration IA backend optionnelle (`backend/.env`) :

```env
AI_API_KEY=your_provider_key
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4o-mini
```

## 📝 Notes

- Les données sont actuellement mockées pour la démo
- Connectez les services API réels dans les fichiers `services/`
- Les stores Zustand peuvent être étendus selon les besoins

