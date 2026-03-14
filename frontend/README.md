# Bravia Hôtel — Frontend (Next.js + Ant Design)

Interface publique et administration pour la gestion des salles.

## Prérequis

- Node.js ≥ 18
- Backend NestJS démarré sur le port 3001

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env.local` à la racine du dossier `frontend/` :

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Démarrage

```bash
# Développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

## Build production

```bash
npm run build
npm run start
```

## Pages

| URL                      | Accès   | Description                                      |
|--------------------------|---------|--------------------------------------------------|
| `/`                      | Public  | Calendrier des réservations (jour/semaine/mois)  |
| `/admin/connexion`       | Public  | Page de connexion admin                          |
| `/admin/reservations`    | Admin   | Gestion des réservations                         |
| `/admin/salles`          | Admin   | Gestion des salles                               |
| `/admin/etages`          | Admin   | Gestion des étages                               |
| `/admin/entreprises`     | Admin   | Gestion des entreprises                          |
| `/admin/utilisateurs`    | SUPER_ADMIN | Gestion des utilisateurs                     |

**Compte par défaut** (créé automatiquement par le backend) :
- Email : `admin@bravia.com`
- Mot de passe : `Admin1234!`

## Thème / Couleurs

Toutes les couleurs sont centralisées dans :

```
src/theme/theme.config.ts
```

Modifier `COULEURS.primaire` pour changer la couleur principale dans toute l'application.

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Page publique (calendrier)
│   ├── admin/
│   │   ├── layout.tsx        # Sidebar admin + protection JWT
│   │   ├── connexion/        # Login
│   │   ├── reservations/     # CRUD réservations
│   │   ├── salles/           # CRUD salles
│   │   ├── etages/           # CRUD étages
│   │   ├── entreprises/      # CRUD entreprises
│   │   └── utilisateurs/     # CRUD utilisateurs (SUPER_ADMIN)
├── lib/
│   ├── api.ts                # Client Axios + toutes les fonctions API
│   └── auth.ts               # Helpers JWT (lecture, déconnexion)
└── theme/
    └── theme.config.ts       # Couleurs centralisées + thème Ant Design
```
