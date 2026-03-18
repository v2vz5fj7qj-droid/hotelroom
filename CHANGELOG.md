# Changelog — Bravia Hôtel Manager

Toutes les modifications notables du projet sont documentées dans ce fichier.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [3.0.0] — 2026-03-18 · commit `498236b`

### Ajouté
- **Entreprises** : nouveaux champs téléphone, email, adresse, secteur d'activité, numéro IFU/RCCM, nom du référent, notes libres, logo (base64)
- **Entreprises** : statut actif / inactif avec bascule directe dans le tableau
- **Module configuration** (backend) : persistance de la configuration d'affichage en base de données MySQL (clé-valeur) — accessible depuis tous les navigateurs et appareils
- **Affichage public** : image de substitution configurable pour les jours sans programme
- **Polices personnalisées** : support Google Fonts (URL) et fichiers locaux (upload base64) dans la configuration d'affichage

### Modifié
- **Affichage public** : exclusion des réservations de statut `ANNULÉE` et `REPORTÉE`
- **Affichage public** : exclusion des réservations liées à une entreprise inactive
- **Affichage public (anonyme)** : affichage du nombre de salles disponibles au lieu des réservations, limité à la date du jour et aux dates futures
- **Numérotation des étages** : affichage « 1er Étage » (ordinal correct) au lieu de « 1ème Étage »
- **Backend** : limite du body parser portée à 20 Mo pour supporter les uploads d'images en base64
- **Polices personnalisées** : correction de la déclaration `@font-face` (`font-family` utilisait la valeur CSS complète au lieu du nom seul)
- **Polices personnalisées** : injection des fonts avant le re-rendu React pour éviter le flash sans police

### Corrigé
- Configuration d'affichage réinitialisée en navigation privée ou sur un autre navigateur (remplacé localStorage seul par persistance API + cache local)
- Image de substitution non sauvegardée (dépassement de la limite body parser par défaut de 100 ko)
- Changement de police sans effet sur l'affichage public

---

## [2.0.0] — 2026-03-17 · commit `3e3ef30`

### Ajouté
- **Page d'affichage public** (`/affichage`) : vue temps réel des réservations du jour, mise à jour automatique toutes les 30 secondes
- **Configuration d'affichage** (`/admin/affichage`) : personnalisation typographie, couleurs, logo, slogan, fond, pointillés
- **Statistiques** (`/admin/statistiques`) : tableau de bord avec graphiques (réservations par salle, par mois, par statut)
- **Module configuration** (frontend) : `configAffichage.ts` avec lecture/écriture synchrone et asynchrone

### Modifié
- Menu sidebar : items conditionnels selon le rôle de l'utilisateur connecté
- Page publique (`/`) : polling toutes les 60 secondes

---

## [1.0.0] — 2026-03-10 · commit `d43dd07`

### Ajouté
- **Backend NestJS** : modules `auth`, `utilisateurs`, `etages`, `salles`, `entreprises`, `reservations`
- **Authentification JWT** avec rôles `SUPER_ADMIN`, `ADMIN`, `VIEWER`
- **Détection de conflits** de réservations (chevauchement de créneaux 30 min, journée entière)
- **Frontend Next.js** avec Ant Design : pages admin CRUD pour toutes les entités
- **Page publique** (`/`) : calendrier des réservations vue jour/semaine/mois
- **Docker Compose** pour MySQL 8.0
- Compte super admin créé automatiquement au premier démarrage (`admin@bravia.com`)

---

*Ce fichier est mis à jour manuellement à chaque push vers le dépôt GitHub.*
