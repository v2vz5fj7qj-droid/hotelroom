# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bravia Hôtel Manager** — système de réservation de salles dans un immeuble hôtelier. Interface entièrement en français. Comprend une page publique interactive et une interface d'administration sécurisée.

- **Backend:** NestJS + TypeORM + MySQL, port 3001
- **Frontend:** Next.js (App Router) + Ant Design, port 3000
- **Base de données:** MySQL 8.0 (disponible via Docker)

## Development Commands

### Base de données (Docker)
```bash
docker compose up -d        # démarre MySQL sur le port 3306
docker compose down         # arrête le conteneur
```
Credentials Docker: `root/root`, base `bravia_hotel_db`.

### Backend (`backend/`)
```bash
npm run dev       # développement avec redémarrage automatique (node --watch)
npm run start     # production
npm run debug     # avec inspecteur Node
```
Config dans `backend/.env` (copier `.env.example`). Les tables sont créées automatiquement au démarrage (`synchronize: true`).

**Compte super admin créé automatiquement au premier démarrage :** `admin@bravia.com` / `Admin1234!`

### Frontend (`frontend/`)
```bash
npm run dev       # développement
npm run build     # build production
npm run start     # serveur production
```
Config dans `frontend/.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

## Architecture

### Backend — Modules NestJS (`backend/src/`)

Tous les modules suivent la même structure : `entity`, `service`, `controller`, `module`, `dto/`.

| Module | Route | Accès | Description |
|---|---|---|---|
| `auth` | `POST /api/auth/connexion` | Public | Login email/mdp, retourne JWT |
| `utilisateurs` | `/api/utilisateurs` | SUPER_ADMIN | CRUD utilisateurs + rôles |
| `etages` | `/api/etages` | GET public, mutations ADMIN+ | Inventaire des étages (0=RDC) |
| `salles` | `/api/salles` | GET public, mutations ADMIN+ | Salles par étage avec capacité |
| `entreprises` | `/api/entreprises` | GET public, mutations ADMIN+ | Répertoire des entreprises |
| `reservations` | `/api/reservations` | GET public, mutations ADMIN+ | Réservations avec détection de conflits |

**Auth:** JWT Bearer token. Guards: `JwtAuthGuard` + `RolesGuard` avec décorateur `@Roles()`.

**Rôles:** `SUPER_ADMIN` (tout), `ADMIN` (pas gestion users), `VIEWER` (lecture seule).

**Détection de conflits** dans `reservations/reservations.service.ts` → `verifierConflit()` : bloque les chevauchements de créneaux 30min et les conflits journée entière.

**Créneaux:** granularité 30 minutes (00 ou 30), validé par regex dans le DTO. Ou journée entière (`estJourneeEntiere: true`).

### Frontend — Pages Next.js (`frontend/src/`)

**Thème centralisé :** `src/theme/theme.config.ts` — modifier `COULEURS.primaire` pour changer la couleur dans toute l'app.

**Client API :** `src/lib/api.ts` — Axios avec intercepteur JWT automatique + redirect `/admin/connexion` sur 401.

**Auth helpers :** `src/lib/auth.ts` — lecture du token/user depuis localStorage.

| Page | Accès | Description |
|---|---|---|
| `/` | Public | Calendrier des réservations (vue jour/semaine/mois), polling 60s |
| `/admin/connexion` | Public | Login |
| `/admin/reservations` | Admin | CRUD réservations, sélecteur créneaux 30min |
| `/admin/salles` | Admin | CRUD salles avec capacité et étage |
| `/admin/etages` | Admin | CRUD étages |
| `/admin/entreprises` | Admin | CRUD entreprises |
| `/admin/utilisateurs` | SUPER_ADMIN | CRUD utilisateurs et rôles |

`src/app/admin/layout.tsx` gère la protection JWT (redirect si non connecté) et le menu sidebar avec items conditionnels selon le rôle.

## Key Domain Details

- Étage 0 = "RDC" partout dans le code et l'UI
- Les réservations peuvent être en créneau (heureDebut/heureFin, multiples de 30min) ou journée entière
- CORS activé côté backend (`origin: '*'`) pour le développement local
- `backend/.env` : `DB_PASSWORD` vide pour MySQL local sans mot de passe, `root` pour Docker
