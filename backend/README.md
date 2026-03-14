# Bravia Hôtel — Backend (NestJS)

API REST pour la gestion des salles, réservations et utilisateurs de l'hôtel.

## Prérequis

- Node.js ≥ 18
- MySQL 8.0 (local ou via Docker)

## Installation

```bash
npm install
```

## Configuration

Copier le fichier d'exemple et ajuster les valeurs :

```bash
cp .env.example .env
```

| Variable        | Défaut              | Description                    |
|-----------------|---------------------|--------------------------------|
| `DB_HOST`       | `127.0.0.1`         | Hôte MySQL                     |
| `DB_PORT`       | `3306`              | Port MySQL                     |
| `DB_USERNAME`   | `root`              | Utilisateur MySQL              |
| `DB_PASSWORD`   | *(vide)*            | Mot de passe MySQL             |
| `DB_DATABASE`   | `bravia_hotel_db`   | Nom de la base de données      |
| `JWT_SECRET`    | *(à changer)*       | Clé secrète pour les tokens JWT|
| `JWT_EXPIRES_IN`| `8h`                | Durée de validité du token     |
| `PORT`          | `3001`              | Port d'écoute du serveur       |

## Démarrage

```bash
# Développement (redémarrage automatique)
npm run dev

# Production
npm run start

# Debug (avec inspecteur Node)
npm run debug
```

L'API est accessible sur `http://localhost:3001/api`.

## Base de données

La base de données et les tables sont créées automatiquement au démarrage (`synchronize: true`).

**Compte super admin par défaut** (créé automatiquement si aucun utilisateur n'existe) :
- Email : `admin@bravia.com`
- Mot de passe : `Admin1234!`

> Changer ce mot de passe immédiatement en production.

## Endpoints principaux

| Méthode | Route                     | Accès         | Description                        |
|---------|---------------------------|---------------|------------------------------------|
| POST    | `/api/auth/connexion`     | Public        | Connexion (retourne un JWT)        |
| GET     | `/api/reservations`       | Public        | Liste des réservations             |
| POST    | `/api/reservations`       | ADMIN+        | Créer une réservation              |
| DELETE  | `/api/reservations/:id`   | ADMIN+        | Supprimer une réservation          |
| GET     | `/api/etages`             | Public        | Liste des étages                   |
| POST    | `/api/etages`             | ADMIN+        | Créer un étage                     |
| GET     | `/api/salles`             | Public        | Liste des salles                   |
| POST    | `/api/salles`             | ADMIN+        | Créer une salle                    |
| GET     | `/api/entreprises`        | Public        | Liste des entreprises              |
| POST    | `/api/entreprises`        | ADMIN+        | Créer une entreprise               |
| GET     | `/api/utilisateurs`       | SUPER_ADMIN   | Liste des utilisateurs             |
| POST    | `/api/utilisateurs`       | SUPER_ADMIN   | Créer un utilisateur               |

## Rôles

| Rôle          | Permissions                                      |
|---------------|--------------------------------------------------|
| `SUPER_ADMIN` | Accès complet, y compris gestion des utilisateurs|
| `ADMIN`       | Gestion des étages, salles, entreprises, réservations |
| `VIEWER`      | Lecture seule sur l'interface admin              |

## Docker (base de données uniquement)

Depuis la racine du projet :

```bash
docker compose up -d
```

Puis dans `.env`, utiliser :
```
DB_HOST=127.0.0.1
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=bravia_hotel_db
```
