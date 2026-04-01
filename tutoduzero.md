# Hotel Manager — Explication simple

## C'est quoi ce projet ?

Un système de **réservation de salles** multi-hôtels. Chaque hôtel a son propre espace isolé. Il y a deux faces :

- Une **page publique** : un calendrier interactif où n'importe qui peut voir les disponibilités de l'hôtel.
- Une **interface admin** : sécurisée par login, pour gérer tout ce qui concerne l'établissement.
- Un **écran d'affichage** : une vue plein écran conçue pour être projetée dans le hall de l'hôtel.

---

## Les grandes entités du projet

| Entité | C'est quoi |
|--------|-----------|
| **Hôtels** | Les établissements gérés par la plateforme. Chacun a un slug unique pour son URL publique |
| **Étages** | Les niveaux du bâtiment (RDC = 0, Étage 1, Étage 2...) rattachés à un hôtel |
| **Salles** | Les salles de réunion, rattachées à un étage, avec une capacité |
| **Entreprises** | Les sociétés clientes qui font des réservations |
| **Réservations** | Une salle + une date + un créneau horaire + une entreprise |
| **Utilisateurs** | Les comptes qui gèrent les données, chacun lié à un hôtel (sauf le Super Admin) |

---

## Comment ça marche techniquement ?

Le projet est divisé en **3 blocs** qui communiquent entre eux :

```
Navigateur (Frontend)
      |
      |  envoie des requêtes HTTP via /api (proxy Next.js)
      v
  API REST (Backend)
      |
      |  lit/écrit dans la base de données
      v
   MySQL (Base de données)
```

> Le proxy Next.js (`/api/*` → `http://localhost:3001/api/*`) permet d'utiliser un seul tunnel ngrok pour l'accès distant.

### Le Frontend (ce que l'utilisateur voit)
- Fait avec **Next.js** (framework React) + **Ant Design** pour les composants
- Tourne sur le port **3000**
- Couleurs et thème centralisés dans `frontend/src/theme/theme.config.ts`
- Le calendrier public se rafraîchit automatiquement toutes les 60 secondes

### Le Backend (le cerveau)
- Fait avec **NestJS** (framework Node.js)
- Tourne sur le port **3001**
- Expose une API REST sous `/api/...`
- Gère l'authentification par **token JWT** stocké dans le navigateur
- Le token contient : l'ID utilisateur, son email, son rôle et son `hotelId`
- Chaque requête est automatiquement filtrée par hôtel grâce au `hotelId` du token

### La Base de données
- **MySQL** qui tourne dans Docker, base : `hotel_manager_db`
- Les tables sont créées automatiquement au démarrage (`synchronize: true`)
- Un compte Super Admin est créé automatiquement au premier lancement

---

## Les rôles utilisateurs

| Rôle | Droits |
|------|--------|
| **SUPER_ADMIN** | Accès total : gère tous les hôtels, tous les utilisateurs, toutes les données |
| **HOTEL_ADMIN** | Gère son hôtel uniquement : étages, salles, entreprises, réservations, config affichage. Peut modifier son propre profil |
| **HOTEL_VIEWER** | Consultation uniquement sur son hôtel. Peut modifier son propre profil |

**Règles importantes :**
- Un HOTEL_ADMIN ne voit que les données de son hôtel (isolation complète entre hôtels)
- Un HOTEL_ADMIN ne peut pas gérer les utilisateurs (réservé au SUPER_ADMIN)
- Tout utilisateur connecté peut modifier ses propres informations (prénom, nom, email, mot de passe) via **Mon profil**
- Le SUPER_ADMIN doit obligatoirement assigner un hôtel lors de la création d'un compte HOTEL_ADMIN ou HOTEL_VIEWER

**Compte Super Admin par défaut :** `admin@hotelmanager.com` / `Admin1234!`

---

## Isolation multi-hôtels

C'est le principe central de l'architecture. Chaque donnée (étage, salle, entreprise, réservation) est liée à un `hotelId`. Quand un HOTEL_ADMIN est connecté :

```
Requête GET /api/etages
→ Backend lit hotelId depuis le JWT
→ Filtre automatiquement les étages de cet hôtel
→ L'admin ne voit jamais les données des autres hôtels
```

Pour les routes publiques (calendrier, écran d'affichage), l'hôtel est identifié par son **slug** dans l'URL, ex : `/affichage/bravia`.

---

## Les règles métier importantes

- Les réservations se font par **créneaux de 30 minutes** (ex: 9h00, 9h30, 10h00...)
- On peut aussi réserver **une journée entière**
- Le système **refuse automatiquement** une réservation si la salle est déjà prise sur ce créneau
- Les réservations annulées ou reportées n'apparaissent pas sur la vue publique
- Les entreprises désactivées n'apparaissent pas sur la vue publique

---

## Comment lancer le projet ?

```bash
# 1. Démarrer la base de données
docker compose up -d

# 2. Lancer le backend
cd backend && npm run start:dev

# 3. Lancer le frontend (dans un autre terminal)
cd frontend && npm run dev

# 4. Ouvrir dans le navigateur
http://localhost:3000
```

---

## Les URLs importantes

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Page publique (calendrier de disponibilité) |
| `http://localhost:3000/admin/connexion` | Page de login admin |
| `http://localhost:3000/admin/reservations` | Gestion des réservations |
| `http://localhost:3000/affichage/[slug]` | Écran d'affichage de l'hôtel (ex: `/affichage/bravia`) |
| `http://localhost:3001/api` | API backend |

---

## Structure des dossiers en un coup d'œil

```
BraviaHotelProject/
├── backend/          → L'API NestJS
│   └── src/
│       ├── auth/           → Connexion + JWT (inclut hotelId dans le token)
│       ├── hotels/         → CRUD des hôtels (SUPER_ADMIN)
│       ├── utilisateurs/   → Gestion des comptes + endpoint /moi (profil)
│       ├── etages/         → Gestion des étages (filtrés par hotelId)
│       ├── salles/         → Gestion des salles
│       ├── entreprises/    → Gestion des entreprises (filtrées par hotelId)
│       ├── reservations/   → Gestion des réservations (filtrées par hotelId)
│       └── configuration/  → Config d'affichage par hôtel (thème, logo, textes)
│
├── frontend/         → L'interface Next.js
│   └── src/
│       ├── app/
│       │   ├── page.tsx              → Calendrier public (page d'accueil)
│       │   ├── affichage/
│       │   │   └── [slug]/           → Écran d'affichage par hôtel
│       │   └── admin/
│       │       ├── connexion/        → Page de login
│       │       ├── profil/           → Mon profil (tous les rôles)
│       │       ├── reservations/     → Admin réservations
│       │       ├── salles/           → Admin salles
│       │       ├── etages/           → Admin étages
│       │       ├── entreprises/      → Admin entreprises
│       │       ├── statistiques/     → Stats par client + export PDF
│       │       ├── affichage/        → Config thème écran d'affichage
│       │       ├── utilisateurs/     → Admin utilisateurs (SUPER_ADMIN uniquement)
│       │       └── hotels/           → Admin hôtels (SUPER_ADMIN uniquement)
│       ├── lib/
│       │   ├── api.ts              → Toutes les fonctions d'appel API (Axios)
│       │   ├── auth.ts             → Lecture du token/utilisateur depuis localStorage
│       │   └── configAffichage.ts  → Gestion de la config d'affichage (thèmes, logo)
│       └── theme/
│           └── theme.config.ts     → Couleurs globales de l'application
│
└── docker-compose.yml  → Lance la base de données MySQL (hotel_manager_db)
```

---

## Mettre à jour le dépôt GitHub

Le dépôt distant est : `https://github.com/v2vz5fj7qj-droid/hotelroom.git`

### Cas standard : envoyer ses modifications

```bash
# 1. Voir ce qui a changé
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Créer un commit avec un message descriptif
git commit -m "Description de ce que tu as fait"

# 4. Envoyer sur GitHub
git push
```

### Cas : première fois sur une nouvelle branche

Si tu travailles sur une nouvelle branche (ex: `ma-branche`), Git ne sait pas encore vers où pousser :

```bash
git push -u origin ma-branche
```

Le `-u` établit le lien une seule fois. Les `git push` suivants n'en ont plus besoin.

### Cas : récupérer les modifications de quelqu'un d'autre

```bash
git pull
```

Si des conflits apparaissent, Git les signale fichier par fichier. Il faut les corriger manuellement puis :

```bash
git add .
git commit -m "Résolution des conflits"
```

### Cas : voir l'historique des commits

```bash
git log --oneline
```

### Ce qu'il ne faut pas envoyer sur GitHub

Le fichier `.gitignore` exclut déjà les éléments sensibles, mais par précaution ne jamais faire `git add` sur :

| Fichier | Pourquoi |
|---------|----------|
| `backend/.env` | Contient les mots de passe de la base de données |
| `frontend/.env.local` | Contient l'URL de l'API |
| `backend/node_modules/` | Trop lourd, se réinstalle avec `npm install` |
| `frontend/node_modules/` | Idem |

### Résumé des commandes du quotidien

```bash
git status              # Voir les fichiers modifiés
git add .               # Préparer tous les changements
git add chemin/fichier  # Préparer un fichier précis
git commit -m "..."     # Créer un point de sauvegarde
git push                # Envoyer sur GitHub
git pull                # Récupérer les dernières modifications
git log --oneline       # Voir l'historique
```

---

## Flux typique : créer un nouvel hôtel

1. Se connecter en tant que **SUPER_ADMIN**
2. Aller dans **Hôtels** → créer un hôtel avec un nom et un slug (ex: `mon-hotel`)
3. Aller dans **Utilisateurs** → créer un compte **HOTEL_ADMIN** en sélectionnant l'hôtel
4. Le HOTEL_ADMIN peut se connecter et commence à configurer son établissement :
   - Ajouter des **étages**
   - Ajouter des **salles** dans ces étages
   - Ajouter des **entreprises** clientes
   - Créer des **réservations**
   - Configurer l'**écran d'affichage** (thème, logo, textes)
5. L'écran public est accessible sur `/affichage/mon-hotel`
